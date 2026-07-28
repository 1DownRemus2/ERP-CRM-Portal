import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";

type Tx = Prisma.TransactionClient;

const router = Router();
router.use(requireAuth);

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

const createChallanSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional().default("DRAFT"),
});

// Generates a challan number like CH-2026-000123 by counting existing challans.
// Good enough for this assignment; a high-concurrency system would use a DB sequence.
async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.challan.count();
  return `CH-${year}-${String(count + 1).padStart(6, "0")}`;
}

// POST /challans — create a challan (Draft or Confirmed).
// If status is CONFIRMED, stock is deducted atomically and cannot go negative.
router.post("/", requireRole("ADMIN", "SALES"), async (req, res) => {
  const parsed = createChallanSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const { customerId, items, status } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) throw { status: 404, message: "Customer not found" };

      // Fetch all products up front and snapshot their current data.
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        if (!productMap.has(item.productId)) {
          throw { status: 404, message: `Product ${item.productId} not found` };
        }
      }

      // If confirming immediately, validate stock BEFORE writing anything.
      if (status === "CONFIRMED") {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          if (product.stock < item.quantity) {
            throw {
              status: 400,
              message: `Insufficient stock for "${product.name}" (available: ${product.stock}, requested: ${item.quantity})`,
            };
          }
        }
      }

      const challanNumber = await generateChallanNumber();
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          status,
          totalQuantity,
          createdById: req.user!.userId,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                unitPrice: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Only deduct stock + log movements if confirmed at creation time.
      if (status === "CONFIRMED") {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              quantity: item.quantity,
              movementType: "OUT",
              reason: `Sales Challan ${challanNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      return challan;
    });

    res.status(201).json(result);
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || "Something went wrong" });
  }
});

// PATCH /challans/:id/confirm — move a Draft challan to Confirmed, deducting stock now.
router.patch("/:id/confirm", requireRole("ADMIN", "SALES"), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: req.params.id as string },
        include: { items: true },
      });
      if (!challan) throw { status: 404, message: "Challan not found" };
      if (challan.status !== "DRAFT") {
        throw { status: 400, message: `Only Draft challans can be confirmed (current status: ${challan.status})` };
      }

      // Re-check live stock (it may have changed since the draft was made).
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw {
            status: 400,
            message: `Insufficient stock for "${item.productName}" (available: ${product?.stock ?? 0}, requested: ${item.quantity})`,
          };
        }
      }

      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Sales Challan ${challan.challanNumber}`,
            createdById: req.user!.userId,
          },
        });
      }

      return tx.challan.update({
        where: { id: challan.id },
        data: { status: "CONFIRMED" },
        include: { items: true },
      });
    });

    res.json(result);
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || "Something went wrong" });
  }
});

// PATCH /challans/:id/cancel — cancel a Draft (no stock to restore) or a Confirmed
// challan (restores stock back).
router.patch("/:id/cancel", requireRole("ADMIN", "SALES"), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id: req.params.id as string },
        include: { items: true },
      });
      if (!challan) throw { status: 404, message: "Challan not found" };
      if (challan.status === "CANCELLED") {
        throw { status: 400, message: "Challan is already cancelled" };
      }

      if (challan.status === "CONFIRMED") {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              movementType: "IN",
              reason: `Cancelled Challan ${challan.challanNumber}`,
              createdById: req.user!.userId,
            },
          });
        }
      }

      return tx.challan.update({
        where: { id: challan.id },
        data: { status: "CANCELLED" },
        include: { items: true },
      });
    });

    res.json(result);
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || "Something went wrong" });
  }
});

// GET /challans?status=&page=&limit=
router.get("/", async (req, res) => {
  const status = req.query.status as string | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(100, parseInt((req.query.limit as string) || "20", 10));

  const where = status ? { status: status as any } : {};

  const [items, total] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } }, items: true },
    }),
    prisma.challan.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.get("/:id", async (req, res) => {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id as string },
    include: { customer: true, items: true, createdBy: { select: { name: true } } },
  });
  if (!challan) return res.status(404).json({ error: "Challan not found" });
  res.json(challan);
});

export default router;

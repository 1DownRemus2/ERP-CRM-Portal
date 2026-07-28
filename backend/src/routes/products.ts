import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { MovementType, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const router = Router();
router.use(requireAuth);

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional(),
  unitPrice: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  location: z.string().optional(),
});

// GET /products?search=&page=&limit=  (only Admin/Warehouse/Accounts/Sales can view, all roles can read)
router.get("/", async (req, res) => {
  const search = (req.query.search as string) || "";
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(100, parseInt((req.query.limit as string) || "20", 10));

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: "asc" } }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// POST /products — only Admin or Warehouse can create products
router.post("/", requireRole("ADMIN", "WAREHOUSE"), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (existing) return res.status(409).json({ error: "A product with this SKU already exists" });

  const product = await prisma.product.create({ data: parsed.data });
  res.status(201).json(product);
});

// PATCH /products/:id
router.patch("/:id", requireRole("ADMIN", "WAREHOUSE"), async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const product = await prisma.product.update({ where: { id: req.params.id as string }, data: parsed.data });
    res.json(product);
  } catch {
    res.status(404).json({ error: "Product not found" });
  }
});

// POST /products/:id/stock-movements — record IN/OUT stock movement and update product.stock
const movementSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  movementType: z.nativeEnum(MovementType),
  reason: z.string().optional(),
});

router.post("/:id/stock-movements", requireRole("ADMIN", "WAREHOUSE"), async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const { quantity, movementType, reason } = parsed.data;

  try {
    // Wrap the stock update + movement log in a transaction so they never
    // get out of sync (e.g. if the process crashes between the two writes).
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: req.params.id as string } });
      if (!product) {
        throw { status: 404, message: "Product not found" };
      }

      const delta = movementType === "IN" ? quantity : -quantity;
      const newStock = product.stock + delta;

      if (newStock < 0) {
        throw { status: 400, message: "Insufficient stock for this movement" };
      }

      const updated = await tx.product.update({
        where: { id: product.id },
        data: { stock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: product.id,
          quantity,
          movementType,
          reason,
          createdById: req.user!.userId,
        },
      });

      return { product: updated, movement };
    });

    res.status(201).json(result);
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err?.message || "Something went wrong" });
  }
});

// GET /products/:id/stock-movements — movement history for a product
router.get("/:id/stock-movements", async (req, res) => {
  const movements = await prisma.stockMovement.findMany({
    where: { productId: req.params.id as string },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  res.json(movements);
});

export default router;

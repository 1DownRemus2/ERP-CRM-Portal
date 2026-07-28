import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { CustomerType, CustomerStatus } from "@prisma/client";

const router = Router();

// All customer routes require a logged-in user.
router.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(6),
  email: z.string().email().optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.nativeEnum(CustomerType),
  address: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

// GET /customers?search=&status=&page=&limit=
router.get("/", async (req, res) => {
  const search = (req.query.search as string) || "";
  const status = req.query.status as CustomerStatus | undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(100, parseInt((req.query.limit as string) || "20", 10));

  const where = {
    AND: [
      status ? { status } : {},
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { mobile: { contains: search, mode: "insensitive" as const } },
              { businessName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /customers/:id  (detail page incl. follow-ups)
router.get("/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { followUps: { orderBy: { createdAt: "desc" } } },
  });

  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

// POST /customers
router.post("/", async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  const customer = await prisma.customer.create({ data: parsed.data });
  res.status(201).json(customer);
});

// PATCH /customers/:id
router.patch("/:id", async (req, res) => {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }

  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(customer);
  } catch {
    res.status(404).json({ error: "Customer not found" });
  }
});

// POST /customers/:id/follow-ups  — add a follow-up note
const followUpSchema = z.object({ note: z.string().min(1) });

router.post("/:id/follow-ups", async (req, res) => {
  const parsed = followUpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const followUp = await prisma.followUp.create({
    data: {
      customerId: customer.id,
      note: parsed.data.note,
      createdById: req.user.userId,
    },
  });

  res.status(201).json(followUp);
});

export default router;

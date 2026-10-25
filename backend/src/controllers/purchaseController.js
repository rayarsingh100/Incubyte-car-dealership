const prisma = require("../lib/prisma");
const { parsePositiveInteger } = require("../lib/validation");

const formatTotalAmount = (unitPrice, quantity) => {
  const [whole, fraction = ""] = String(unitPrice).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  const totalCents = cents * BigInt(quantity);
  return `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, "0")}`;
};

const listPurchases = async (req, res) => {
  const page = parsePositiveInteger(req.query.page, "page", 1, 1000000);
  const limit = parsePositiveInteger(req.query.limit, "limit", 20, 100);
  const where = { userId: req.user.id };
  const [records, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        vehicleId: true,
        quantity: true,
        unitPrice: true,
        createdAt: true,
        vehicle: { select: { id: true, make: true, model: true, category: true } },
      },
    }),
    prisma.purchase.count({ where }),
  ]);

  const purchases = records.map((purchase) => ({
    ...purchase,
    totalAmount: formatTotalAmount(purchase.unitPrice, purchase.quantity),
  }));

  return res.status(200).json({
    purchases,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

module.exports = { listPurchases };

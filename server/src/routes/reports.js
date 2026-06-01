import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/reports/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { from, to, clientId, status } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (from || to) {
      where.issueDate = {};
      if (from) where.issueDate.gte = new Date(from);
      if (to) where.issueDate.lte = new Date(to);
    }
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true, company: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { issueDate: 'desc' },
    });
    // Compute paid amount per invoice
    const data = invoices.map(inv => ({
      ...inv,
      paidAmount: inv.payments.reduce((s, p) => s + p.amount, 0),
    }));
    res.json(data);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31T23:59:59`);
    const [invoices, payments, quotes] = await Promise.all([
      prisma.invoice.findMany({ where: { issueDate: { gte: start, lte: end }, userId: req.user.id } }),
      prisma.payment.findMany({ where: { date: { gte: start, lte: end }, invoice: { userId: req.user.id } } }),
      prisma.quote.findMany({ where: { issueDate: { gte: start, lte: end }, userId: req.user.id } }),
    ]);
    const byMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const inv = invoices.filter(x => new Date(x.issueDate).getMonth() + 1 === m);
      const pay = payments.filter(x => new Date(x.date).getMonth() + 1 === m);
      return {
        month: m,
        invoices: inv.length,
        revenue: pay.reduce((s, p) => s + p.amount, 0),
        invoiceTotal: inv.reduce((s, i) => s + i.total, 0),
      };
    });
    res.json({
      year: Number(year),
      totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
      totalInvoiced: invoices.reduce((s, i) => s + i.total, 0),
      invoiceCount: invoices.length,
      quoteCount: quotes.length,
      byMonth,
    });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

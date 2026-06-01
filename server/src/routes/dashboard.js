import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalInvoices, paidInvoices, pendingInvoices, overdueInvoices,
      totalRevenue, monthRevenue, totalClients, totalQuotes, convertedQuotes,
    ] = await Promise.all([
      prisma.invoice.count({ where: { userId: req.user.id } }),
      prisma.invoice.count({ where: { userId: req.user.id, status: 'paid' } }),
      prisma.invoice.count({ where: { userId: req.user.id, status: { in: ['sent', 'viewed'] } } }),
      prisma.invoice.count({ where: { userId: req.user.id, status: 'overdue' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { invoice: { userId: req.user.id } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { invoice: { userId: req.user.id }, date: { gte: startOfMonth } } }),
      prisma.client.count({ where: { userId: req.user.id, status: 'active' } }),
      prisma.quote.count({ where: { userId: req.user.id } }),
      prisma.quote.count({ where: { userId: req.user.id, status: 'converted' } }),
    ]);

    res.json({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthRevenue: monthRevenue._sum.amount || 0,
      totalClients,
      quoteConversionRate: totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/dashboard/monthly-revenue — last 12 months
router.get('/monthly-revenue', async (req, res) => {
  try {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const result = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { date: { gte: start, lte: end }, invoice: { userId: req.user.id } },
      });
      months.push({
        month: start.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
        revenue: result._sum.amount || 0,
      });
    }
    res.json(months);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/dashboard/top-clients
router.get('/top-clients', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: 'paid', userId: req.user.id },
      include: { client: { select: { id: true, name: true, company: true } } },
    });
    const map = {};
    for (const inv of invoices) {
      const key = inv.clientId;
      if (!map[key]) map[key] = { client: inv.client, total: 0, count: 0 };
      map[key].total += inv.total;
      map[key].count += 1;
    }
    const sorted = Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
    res.json(sorted);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/dashboard/recent-invoices
router.get('/recent-invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true, company: true } } },
    });
    res.json(invoices);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

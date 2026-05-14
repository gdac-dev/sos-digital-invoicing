import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/payments — payments for an invoice
router.get('/', async (req, res) => {
  try {
    const { invoiceId } = req.query;
    const where = {};
    if (invoiceId) where.invoiceId = invoiceId;
    const payments = await prisma.payment.findMany({
      where,
      include: { invoice: { select: { number: true, total: true, client: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const { invoiceId, amount, method, date, notes, isPartial } = req.body;
    if (!invoiceId || !amount) return res.status(400).json({ error: 'Facture et montant requis' });

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: Number(amount),
        method: method || 'cash',
        date: date ? new Date(date) : new Date(),
        notes,
        isPartial: isPartial ?? false,
      },
    });

    // Auto-update invoice status
    const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0) + Number(amount);
    let newStatus = invoice.status;
    if (totalPaid >= invoice.total) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'sent'; // partial — keep as sent
    }
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });

    res.status(201).json(payment);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Paiement supprimé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

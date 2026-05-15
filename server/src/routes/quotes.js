import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count();
  return `DEV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/quotes
router.get('/', async (req, res) => {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { client: { select: { id: true, name: true, company: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.quote.count({ where }),
    ]);
    res.json({ quotes, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/quotes/:id
router.get('/:id', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { client: true, items: true, user: { select: { id: true, name: true } } },
    });
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });
    res.json(quote);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { clientId, templateType, palette, language, taxRate, discount, currency, validUntil, notes, items } = req.body;
    if (!clientId || !items?.length) return res.status(400).json({ error: 'Client et articles requis' });
    const number = await generateQuoteNumber();
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = (subtotal - (discount || 0)) * ((taxRate || 0) / 100);
    const total = subtotal - (discount || 0) + taxAmount;
    const quote = await prisma.quote.create({
      data: {
        number, clientId, userId: req.user.id,
        templateType: templateType || 'classic',
        palette: palette || 'skyblue',
        language: language || 'fr',
        subtotal, taxRate: taxRate || 0, taxAmount, discount: discount || 0, total,
        currency: currency || 'FCFA',
        validUntil: validUntil ? new Date(validUntil) : undefined,
        notes,
        items: {
          create: items.map(i => ({
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            total: Number(i.quantity) * Number(i.unitPrice),
          })),
        },
      },
      include: { client: true, items: true },
    });
    res.status(201).json(quote);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/quotes/:id/convert — Convert quote to invoice
router.post('/:id/convert', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });
    if (quote.convertedInvoiceId) return res.status(400).json({ error: 'Devis déjà converti' });

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const number = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        number, clientId: quote.clientId, userId: req.user.id,
        templateType: quote.templateType, palette: quote.palette, language: quote.language,
        subtotal: quote.subtotal, taxRate: quote.taxRate, taxAmount: quote.taxAmount,
        discount: quote.discount, total: quote.total, currency: quote.currency,
        notes: quote.notes,
        items: {
          create: quote.items.map(i => ({
            description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total,
          })),
        },
      },
      include: { client: true, items: true },
    });

    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'converted', convertedInvoiceId: invoice.id },
    });

    res.json({ invoice });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/quotes/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, templateType, palette, notes, validUntil } = req.body;
    const updateData = { status, notes, validUntil: validUntil ? new Date(validUntil) : undefined };
    if (templateType) updateData.templateType = templateType;
    if (palette) updateData.palette = palette;
    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(quote);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/quotes/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id } });
    res.json({ message: 'Devis supprimé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Generate invoice number
const generateNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
};

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { status, clientId, search, page = 1, limit = 20, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (from || to) {
      where.issueDate = {};
      if (from) where.issueDate.gte = new Date(from);
      if (to) where.issueDate.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { client: { select: { id: true, name: true, company: true } }, user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ invoices, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { catalogItem: true } },
        payments: { orderBy: { date: 'desc' } },
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });
    res.json(invoice);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { clientId, templateType, palette, language, taxRate, discount, currency, dueDate, notes, footer, items } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Articles requis' });
    
    // Resolve or create client
    let resolvedClientId = clientId || null;
    if (!resolvedClientId) return res.status(400).json({ error: 'Client requis' });

    const parsedItems = items.map(i => ({
      sectionTitle: i.sectionTitle || null,
      description: String(i.description || ''),
      quantity: parseFloat(i.quantity) || 1,
      unitPrice: parseFloat(i.unitPrice) || 0,
      catalogItemId: i.catalogItemId || null,
    }));

    const number = await generateNumber();
    const subtotal = parsedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const disc = parseFloat(discount) || 0;
    const tax = parseFloat(taxRate) || 0;
    const taxAmount = (subtotal - disc) * (tax / 100);
    const total = subtotal - disc + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        number, clientId: resolvedClientId, userId: req.user.id,
        templateType: templateType || 'classic',
        palette: palette || 'skyblue',
        language: language || 'fr',
        subtotal: Number(subtotal), taxRate: Number(tax), taxAmount: Number(taxAmount), discount: Number(disc), total: Number(total),
        currency: currency || 'FCFA',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || null, footer: footer || null,
        items: {
          create: parsedItems.map(i => ({
            catalogItemId: i.catalogItemId,
            sectionTitle: i.sectionTitle,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { client: true, items: true },
    });
    res.status(201).json(invoice);
  } catch (e) {
    console.error('Invoice creation error:', e);
    res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
});

// PATCH /api/invoices/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, templateType, palette, language, taxRate, discount, currency, dueDate, notes, footer, items } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (templateType) updateData.templateType = templateType;
    if (palette) updateData.palette = palette;
    if (language) updateData.language = language;
    if (currency) updateData.currency = currency;
    if (notes !== undefined) updateData.notes = notes;
    if (footer !== undefined) updateData.footer = footer;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (items) {
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const taxAmt = (subtotal - (discount || 0)) * ((taxRate || 0) / 100);
      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate || 0;
      updateData.taxAmount = taxAmt;
      updateData.discount = discount || 0;
      updateData.total = subtotal - (discount || 0) + taxAmt;
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
      updateData.items = {
        create: items.map(i => ({
          catalogItemId: i.catalogItemId || null,
          sectionTitle: i.sectionTitle || null,
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          total: Number(i.quantity) * Number(i.unitPrice),
        })),
      };
    }
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: { client: true, items: true, payments: true },
    });
    res.json(invoice);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Facture supprimée' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

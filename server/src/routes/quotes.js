import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const lastQuote = await prisma.quote.findFirst({
    where: { number: { startsWith: `DEV-${year}-` } },
    orderBy: { createdAt: 'desc' }
  });

  let nextSeq = 1;
  if (lastQuote) {
    const parts = lastQuote.number.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
  }

  let number = `DEV-${year}-${String(nextSeq).padStart(4, '0')}`;
  let exists = await prisma.quote.findUnique({ where: { number } });
  
  while (exists) {
    nextSeq++;
    number = `DEV-${year}-${String(nextSeq).padStart(4, '0')}`;
    exists = await prisma.quote.findUnique({ where: { number } });
  }

  return number;
};

const parseQuoteJSON = (q) => ({
  ...q,
  watermark: q.watermark ? JSON.parse(q.watermark) : null,
  stamp: q.stamp ? JSON.parse(q.stamp) : null,
  companyData: q.companyData ? JSON.parse(q.companyData) : null,
});

// GET /api/quotes
router.get('/', async (req, res) => {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
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
    res.json({ quotes: quotes.map(parseQuoteJSON), total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/quotes/:id
router.get('/:id', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id, userId: req.user.id },
      include: { client: true, items: true, user: { select: { id: true, name: true } } },
    });
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });
    res.json(parseQuoteJSON(quote));
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { clientId, templateType, palette, language, taxRate, discount, currency, validUntil, issueDate, notes, footer, items, font, watermark, stamp, labour, extra, companyData, paymentMethod } = req.body;
    if (!clientId || !items?.length) return res.status(400).json({ error: 'Client et articles requis' });

    const parsedItems = items.map(i => ({
      sectionTitle: i.sectionTitle || null,
      description: String(i.description || ''),
      quantity: parseFloat(i.quantity) || 1,
      unit: i.unit || 'Unité',
      unitPrice: parseFloat(i.unitPrice) || 0,
    }));

    const number = await generateQuoteNumber();
    const subtotal = parsedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const disc = parseFloat(discount) || 0;
    const lab = parseFloat(labour) || 0;
    const ext = parseFloat(extra) || 0;
    const tax = parseFloat(taxRate) || 0;
    const baseForTax = subtotal - disc + lab + ext;
    const taxAmount = baseForTax * (tax / 100);
    const total = baseForTax + taxAmount;

    const quote = await prisma.quote.create({
      data: {
        number, clientId, userId: req.user.id,
        templateType: templateType || 'classic',
        palette: palette || 'skyblue',
        language: language || 'fr',
        subtotal: Number(subtotal), taxRate: Number(tax), taxAmount: Number(taxAmount), discount: Number(disc), total: Number(total),
        currency: currency || 'FCFA',
        issueDate: issueDate ? new Date(issueDate) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        notes: notes || null, footer: footer || null,
        font: font || 'Inter',
        watermark: watermark ? JSON.stringify(watermark) : null,
        stamp: stamp ? JSON.stringify(stamp) : null,
        labour: Number(labour) || 0, extra: Number(extra) || 0,
        companyData: companyData ? JSON.stringify(companyData) : null,
        paymentMethod: paymentMethod || 'Virement',
        items: {
          create: parsedItems.map(i => ({
            sectionTitle: i.sectionTitle,
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { client: true, items: true },
    });
    res.status(201).json(parseQuoteJSON(quote));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/quotes/:id/convert — Convert quote to invoice
router.post('/:id/convert', async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: true },
    });
    if (!quote) return res.status(404).json({ error: 'Devis introuvable' });
    if (quote.convertedInvoiceId) return res.status(400).json({ error: 'Devis déjà converti' });

    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: { number: { startsWith: `INV-${year}-` } },
      orderBy: { createdAt: 'desc' }
    });

    let nextSeq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.number.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }
    }

    let number = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
    let exists = await prisma.invoice.findUnique({ where: { number } });
    
    while (exists) {
      nextSeq++;
      number = `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
      exists = await prisma.invoice.findUnique({ where: { number } });
    }

    const invoice = await prisma.invoice.create({
      data: {
        number, clientId: quote.clientId, userId: req.user.id,
        templateType: quote.templateType, palette: quote.palette, language: quote.language,
        subtotal: quote.subtotal, taxRate: quote.taxRate, taxAmount: quote.taxAmount,
        discount: quote.discount, total: quote.total, currency: quote.currency,
        notes: quote.notes, footer: quote.footer,
        font: quote.font || 'Inter',
        watermark: quote.watermark, // already JSON string
        stamp: quote.stamp, // already JSON string
        labour: quote.labour || 0, extra: quote.extra || 0,
        companyData: quote.companyData, // already JSON string
        paymentMethod: quote.paymentMethod || 'Virement',
        items: {
          create: quote.items.map(i => ({
            sectionTitle: i.sectionTitle, description: i.description,
            quantity: i.quantity, unit: i.unit || 'Unité',
            unitPrice: i.unitPrice, total: i.total,
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
    const { status, templateType, palette, language, taxRate, discount, currency, validUntil, issueDate, notes, footer, items, font, watermark, stamp, labour, extra, companyData, paymentMethod } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (templateType) updateData.templateType = templateType;
    if (palette) updateData.palette = palette;
    if (language) updateData.language = language;
    if (currency) updateData.currency = currency;
    if (notes !== undefined) updateData.notes = notes;
    if (footer !== undefined) updateData.footer = footer;
    if (font !== undefined) updateData.font = font;
    if (watermark !== undefined) updateData.watermark = watermark ? JSON.stringify(watermark) : null;
    if (stamp !== undefined) updateData.stamp = stamp ? JSON.stringify(stamp) : null;
    if (labour !== undefined) updateData.labour = Number(labour);
    if (extra !== undefined) updateData.extra = Number(extra);
    if (companyData !== undefined) updateData.companyData = companyData ? JSON.stringify(companyData) : null;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (issueDate) updateData.issueDate = new Date(issueDate);
    if (validUntil) updateData.validUntil = new Date(validUntil);

    if (items) {
      const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
      const disc = discount || 0;
      const lab = labour || 0;
      const ext = extra || 0;
      const baseForTax = subtotal - disc + lab + ext;
      const taxAmt = baseForTax * ((taxRate || 0) / 100);
      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate || 0;
      updateData.taxAmount = taxAmt;
      updateData.discount = disc;
      updateData.total = baseForTax + taxAmt;
      await prisma.quoteItem.deleteMany({ where: { quoteId: req.params.id } });
      updateData.items = {
        create: items.map(i => ({
          sectionTitle: i.sectionTitle || null,
          description: i.description,
          quantity: Number(i.quantity),
          unit: i.unit || 'Unité',
          unitPrice: Number(i.unitPrice),
          total: Number(i.quantity) * Number(i.unitPrice),
        })),
      };
    }

    const quote = await prisma.quote.update({
      where: { id: req.params.id, userId: req.user.id },
      data: updateData,
      include: { client: true, items: true },
    });
    res.json(parseQuoteJSON(quote));
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/quotes/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Devis supprimé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

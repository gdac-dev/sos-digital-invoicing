import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/catalog
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = { isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;
    const items = await prisma.catalogItem.findMany({ where, orderBy: { name: 'asc' } });
    res.json(items);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/catalog
router.post('/', async (req, res) => {
  try {
    const { name, description, unitPrice, currency, category } = req.body;
    if (!name || unitPrice === undefined) return res.status(400).json({ error: 'Nom et prix requis' });
    const item = await prisma.catalogItem.create({
      data: { name, description, unitPrice: Number(unitPrice), currency: currency || 'FCFA', category },
    });
    res.status(201).json(item);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/catalog/:id
router.patch('/:id', async (req, res) => {
  try {
    const { name, description, unitPrice, currency, category, isActive } = req.body;
    const item = await prisma.catalogItem.update({
      where: { id: req.params.id },
      data: { name, description, unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined, currency, category, isActive },
    });
    res.json(item);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/catalog/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.catalogItem.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Service archivé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (status) where.status = status;
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { _count: { select: { invoices: true } } },
      }),
      prisma.client.count({ where }),
    ]);
    res.json({ clients, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        quotes: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    res.json(client);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, address, city, country, taxId, status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });
    const client = await prisma.client.create({
      data: { userId: req.user.id, name, company, email, phone, address, city, country: country || 'Cameroun', taxId, status: status || 'active', notes },
    });
    res.status(201).json(client);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/clients/:id
router.patch('/:id', async (req, res) => {
  try {
    const { name, company, email, phone, address, city, country, taxId, status, notes } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { name, company, email, phone, address, city, country, taxId, status, notes },
    });
    res.json(client);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ message: 'Client supprimé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

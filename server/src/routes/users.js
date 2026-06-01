import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

const isSuperAdmin = (req) => req.user.email === process.env.ADMIN_EMAIL;

// GET /api/users
router.get('/', async (req, res) => {
  try {
    if (isSuperAdmin(req)) {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true, canViewData: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } else {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, canViewData: true, isActive: true, createdAt: true },
      });
      res.json(user && user.isActive ? [user] : []);
    }
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/users — creation via UI is disabled, but if called, restrict to super admin
router.post('/', async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ error: 'Accès refusé' });
  try {
    const { name, email, password, role, canViewData } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed, role: 'admin', canViewData: true },
      select: { id: true, name: true, email: true, role: true, canViewData: true, isActive: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res) => {
  if (!isSuperAdmin(req) && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  try {
    const { name, email, role, canViewData, isActive, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email.toLowerCase();
    
    // Only super admin can change active status
    if (isSuperAdmin(req) && isActive !== undefined) data.isActive = isActive;
    
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, canViewData: true, isActive: true },
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ error: 'Accès refusé' });
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Utilisateur désactivé' });
  } catch { res.status(500).json({ error: 'Erreur serveur' }); }
});

export default router;

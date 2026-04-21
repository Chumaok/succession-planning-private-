import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users
router.get('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { orgUnit: true },
      orderBy: { name: 'asc' },
    });
    res.json(users.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role,
      orgUnit: u.orgUnit, createdAt: u.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, orgUnitId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'HR', orgUnitId: orgUnitId || null },
      include: { orgUnit: true },
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, orgUnit: user.orgUnit });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, orgUnitId } = req.body;
    const data = { name, email, role, orgUnitId: orgUnitId || null };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      include: { orgUnit: true },
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, orgUnit: user.orgUnit });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

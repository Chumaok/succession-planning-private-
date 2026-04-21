import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

function buildTree(units, parentId = null) {
  return units
    .filter(u => u.parentId === parentId)
    .map(u => ({ ...u, children: buildTree(units, u.id) }));
}

// GET /api/org-units/tree
router.get('/tree', authenticate, async (req, res) => {
  try {
    const units = await prisma.orgUnit.findMany({ orderBy: { name: 'asc' } });
    const tree = buildTree(units);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/org-units
router.get('/', authenticate, async (req, res) => {
  try {
    const units = await prisma.orgUnit.findMany({
      include: { parent: true, children: true },
      orderBy: { name: 'asc' },
    });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/org-units
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, type, parentId } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });
    const unit = await prisma.orgUnit.create({
      data: { name, type, parentId: parentId || null },
      include: { parent: true },
    });
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/org-units/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, type, parentId } = req.body;
    const unit = await prisma.orgUnit.update({
      where: { id: req.params.id },
      data: { name, type, parentId: parentId || null },
      include: { parent: true },
    });
    res.json(unit);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Org unit not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/org-units/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.orgUnit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Org unit deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Org unit not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/talent-pools
router.get('/', authenticate, async (req, res) => {
  try {
    const pools = await prisma.talentPool.findMany({
      include: {
        members: {
          include: {
            employee: { include: { orgUnit: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(pools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talent-pools/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = await prisma.talentPool.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            employee: { include: { orgUnit: true, retirementProfile: true } },
          },
        },
      },
    });
    if (!pool) return res.status(404).json({ error: 'Talent pool not found' });
    res.json(pool);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talent-pools
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, poolType, description } = req.body;
    if (!name || !poolType) return res.status(400).json({ error: 'Name and poolType required' });
    const pool = await prisma.talentPool.create({ data: { name, poolType, description } });
    res.status(201).json(pool);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/talent-pools/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, poolType, description } = req.body;
    const pool = await prisma.talentPool.update({
      where: { id: req.params.id },
      data: { name, poolType, description },
    });
    res.json(pool);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Talent pool not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/talent-pools/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.talentPool.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Talent pool not found' });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talent-pools/:id/members
router.post('/:id/members', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { employeeId, developmentPlan, trainingProgress } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required' });
    const member = await prisma.talentPoolMember.create({
      data: {
        talentPoolId: req.params.id,
        employeeId,
        developmentPlan,
        trainingProgress: trainingProgress || 0,
      },
      include: { employee: { include: { orgUnit: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/talent-pools/:id/members/:employeeId
router.delete('/:id/members/:employeeId', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const member = await prisma.talentPoolMember.findFirst({
      where: { talentPoolId: req.params.id, employeeId: req.params.employeeId },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    await prisma.talentPoolMember.delete({ where: { id: member.id } });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

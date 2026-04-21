import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/positions
router.get('/', authenticate, async (req, res) => {
  try {
    const { isCritical, orgUnitId, criticalityLevel } = req.query;
    const where = {};
    if (isCritical !== undefined) where.isCritical = isCritical === 'true';
    if (orgUnitId) where.orgUnitId = orgUnitId;
    if (criticalityLevel) where.criticalityLevel = criticalityLevel;

    const positions = await prisma.position.findMany({
      where,
      include: {
        orgUnit: true,
        successors: { select: { id: true } },
      },
      orderBy: { jobTitle: 'asc' },
    });

    res.json(positions.map(p => ({
      ...p,
      successorCount: p.successors.length,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/positions/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const position = await prisma.position.findUnique({
      where: { id: req.params.id },
      include: {
        orgUnit: true,
        successors: {
          include: {
            employee: { include: { orgUnit: true, retirementProfile: true } },
          },
        },
        riskAssessments: true,
      },
    });
    if (!position) return res.status(404).json({ error: 'Position not found' });
    res.json(position);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/positions
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { jobTitle, orgUnitId, location, isCritical, criticalityLevel, description, competencies, skills } = req.body;
    if (!jobTitle) return res.status(400).json({ error: 'Job title required' });
    const position = await prisma.position.create({
      data: {
        jobTitle,
        orgUnitId: orgUnitId || null,
        location,
        isCritical: isCritical || false,
        criticalityLevel: criticalityLevel || 'LOW',
        description,
        competencies: competencies || [],
        skills: skills || [],
      },
      include: { orgUnit: true },
    });
    res.status(201).json(position);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/positions/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { jobTitle, orgUnitId, location, isCritical, criticalityLevel, description, competencies, skills } = req.body;
    const position = await prisma.position.update({
      where: { id: req.params.id },
      data: {
        jobTitle,
        orgUnitId: orgUnitId || null,
        location,
        isCritical,
        criticalityLevel,
        description,
        competencies: competencies || [],
        skills: skills || [],
      },
      include: { orgUnit: true },
    });
    res.json(position);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Position not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/positions/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.position.delete({ where: { id: req.params.id } });
    res.json({ message: 'Position deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Position not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

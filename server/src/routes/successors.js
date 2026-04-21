import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/successors
router.get('/', authenticate, async (req, res) => {
  try {
    const { positionId, status } = req.query;
    const where = {};
    if (positionId) where.positionId = positionId;
    if (status) where.status = status;

    const successors = await prisma.successor.findMany({
      where,
      include: {
        employee: { include: { orgUnit: true, retirementProfile: true } },
        position: { include: { orgUnit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/successors/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const successor = await prisma.successor.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { include: { orgUnit: true } },
        position: { include: { orgUnit: true } },
        comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!successor) return res.status(404).json({ error: 'Successor not found' });
    res.json(successor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/successors
router.post('/', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const {
      employeeId, positionId, isPrimary, readinessLevel,
      performanceRating, potentialRating, strengths, developmentAreas,
      leadershipPotential, mobility, status,
    } = req.body;
    if (!employeeId || !positionId) return res.status(400).json({ error: 'employeeId and positionId are required' });

    const successor = await prisma.successor.create({
      data: {
        employeeId, positionId,
        isPrimary: isPrimary || false,
        readinessLevel: readinessLevel || 'READY_3_5_YEARS',
        performanceRating: performanceRating || 3,
        potentialRating: potentialRating || 3,
        strengths, developmentAreas, leadershipPotential,
        mobility: mobility || false,
        status: status || 'DRAFT',
      },
      include: {
        employee: { include: { orgUnit: true } },
        position: { include: { orgUnit: true } },
      },
    });
    res.status(201).json(successor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/successors/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const {
      employeeId, positionId, isPrimary, readinessLevel,
      performanceRating, potentialRating, strengths, developmentAreas,
      leadershipPotential, mobility, status,
    } = req.body;

    const successor = await prisma.successor.update({
      where: { id: req.params.id },
      data: {
        employeeId, positionId, isPrimary, readinessLevel,
        performanceRating, potentialRating, strengths, developmentAreas,
        leadershipPotential, mobility, status,
      },
      include: {
        employee: { include: { orgUnit: true } },
        position: { include: { orgUnit: true } },
      },
    });
    res.json(successor);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Successor not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/successors/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.successor.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Successor not found' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/successors/:id/comments
router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { successorId: req.params.id },
      include: { author: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/successors/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content, version } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const comment = await prisma.comment.create({
      data: {
        successorId: req.params.id,
        authorId: req.user.id,
        content,
        version: version || 1,
      },
      include: { author: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

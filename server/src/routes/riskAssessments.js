import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/risk-assessments
router.get('/', authenticate, async (req, res) => {
  try {
    const { riskLevel, positionId } = req.query;
    const where = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (positionId) where.positionId = positionId;

    const assessments = await prisma.riskAssessment.findMany({
      where,
      include: {
        position: { include: { orgUnit: true } },
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/risk-assessments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const assessment = await prisma.riskAssessment.findUnique({
      where: { id: req.params.id },
      include: { position: { include: { orgUnit: true } }, employee: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Risk assessment not found' });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/risk-assessments
router.post('/', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const { positionId, employeeId, riskLevel, flightRiskScore, engagementScore, marketDemand, notes } = req.body;
    if (!positionId) return res.status(400).json({ error: 'positionId is required' });
    const assessment = await prisma.riskAssessment.create({
      data: {
        positionId,
        employeeId: employeeId || null,
        riskLevel: riskLevel || 'LOW',
        flightRiskScore: flightRiskScore || 0,
        engagementScore: engagementScore || 5,
        marketDemand,
        notes,
      },
      include: { position: { include: { orgUnit: true } }, employee: true },
    });
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/risk-assessments/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const { positionId, employeeId, riskLevel, flightRiskScore, engagementScore, marketDemand, notes } = req.body;
    const assessment = await prisma.riskAssessment.update({
      where: { id: req.params.id },
      data: {
        positionId,
        employeeId: employeeId || null,
        riskLevel,
        flightRiskScore,
        engagementScore,
        marketDemand,
        notes,
      },
      include: { position: { include: { orgUnit: true } }, employee: true },
    });
    res.json(assessment);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Risk assessment not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/risk-assessments/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.riskAssessment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Risk assessment not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

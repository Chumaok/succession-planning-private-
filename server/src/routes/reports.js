import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/critical-roles
router.get('/critical-roles', authenticate, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      where: { isCritical: true },
      include: {
        orgUnit: true,
        successors: {
          select: { id: true, readinessLevel: true, status: true },
        },
      },
      orderBy: { criticalityLevel: 'asc' },
    });

    const result = positions.map(p => ({
      id: p.id,
      jobTitle: p.jobTitle,
      department: p.orgUnit?.name || 'N/A',
      criticalityLevel: p.criticalityLevel,
      successorCount: p.successors.length,
      hasFinalizedSuccessor: p.successors.some(s => s.status === 'FINALIZED'),
      readyNowCount: p.successors.filter(s => s.readinessLevel === 'READY_NOW').length,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/risk-summary
router.get('/risk-summary', authenticate, async (req, res) => {
  try {
    const [high, medium, low] = await Promise.all([
      prisma.riskAssessment.count({ where: { riskLevel: 'HIGH' } }),
      prisma.riskAssessment.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.riskAssessment.count({ where: { riskLevel: 'LOW' } }),
    ]);

    const byPosition = await prisma.riskAssessment.findMany({
      include: { position: { include: { orgUnit: true } } },
      orderBy: { riskLevel: 'asc' },
    });

    res.json({
      summary: { high, medium, low, total: high + medium + low },
      details: byPosition,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/retirement-risk
router.get('/retirement-risk', authenticate, async (req, res) => {
  try {
    const profiles = await prisma.retirementProfile.findMany({
      include: {
        employee: {
          include: { orgUnit: true },
        },
      },
    });

    const byDept = {};
    for (const p of profiles) {
      const dept = p.employee.orgUnit?.name || 'Unknown';
      if (!byDept[dept]) byDept[dept] = { IMMEDIATE: 0, MID_TERM: 0, LONG_TERM: 0 };
      byDept[dept][p.category]++;
    }

    const breakdown = Object.entries(byDept).map(([dept, counts]) => ({
      department: dept,
      ...counts,
      total: counts.IMMEDIATE + counts.MID_TERM + counts.LONG_TERM,
    }));

    const categoryCounts = {
      IMMEDIATE: profiles.filter(p => p.category === 'IMMEDIATE').length,
      MID_TERM: profiles.filter(p => p.category === 'MID_TERM').length,
      LONG_TERM: profiles.filter(p => p.category === 'LONG_TERM').length,
    };

    res.json({ breakdown, categoryCounts, profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/successor-readiness
router.get('/successor-readiness', authenticate, async (req, res) => {
  try {
    const [readyNow, ready12, ready35] = await Promise.all([
      prisma.successor.count({ where: { readinessLevel: 'READY_NOW' } }),
      prisma.successor.count({ where: { readinessLevel: 'READY_1_2_YEARS' } }),
      prisma.successor.count({ where: { readinessLevel: 'READY_3_5_YEARS' } }),
    ]);

    const successors = await prisma.successor.findMany({
      include: {
        employee: true,
        position: { include: { orgUnit: true } },
      },
    });

    res.json({
      distribution: {
        READY_NOW: readyNow,
        READY_1_2_YEARS: ready12,
        READY_3_5_YEARS: ready35,
        total: readyNow + ready12 + ready35,
      },
      successors,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

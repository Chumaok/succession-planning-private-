import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const [
      totalEmployees,
      totalPositions,
      totalSuccessors,
      criticalPositions,
      successors,
      riskAssessments,
      retirementProfiles,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.position.count(),
      prisma.successor.count(),
      prisma.position.findMany({
        where: { isCritical: true },
        include: { successors: { select: { id: true, readinessLevel: true } } },
      }),
      prisma.successor.findMany({ select: { readinessLevel: true } }),
      prisma.riskAssessment.findMany({ select: { riskLevel: true } }),
      prisma.retirementProfile.findMany({ select: { category: true } }),
    ]);

    const criticalWithSuccessors = criticalPositions.filter(p => p.successors.length > 0).length;
    const successionCoverage = criticalPositions.length > 0
      ? Math.round((criticalWithSuccessors / criticalPositions.length) * 100)
      : 0;

    const highRiskRoles = riskAssessments.filter(r => r.riskLevel === 'HIGH').length;

    const retirementExposure = {
      IMMEDIATE: retirementProfiles.filter(p => p.category === 'IMMEDIATE').length,
      MID_TERM: retirementProfiles.filter(p => p.category === 'MID_TERM').length,
      LONG_TERM: retirementProfiles.filter(p => p.category === 'LONG_TERM').length,
    };

    const readinessDistribution = {
      READY_NOW: successors.filter(s => s.readinessLevel === 'READY_NOW').length,
      READY_1_2_YEARS: successors.filter(s => s.readinessLevel === 'READY_1_2_YEARS').length,
      READY_3_5_YEARS: successors.filter(s => s.readinessLevel === 'READY_3_5_YEARS').length,
    };

    const riskBreakdown = {
      HIGH: riskAssessments.filter(r => r.riskLevel === 'HIGH').length,
      MEDIUM: riskAssessments.filter(r => r.riskLevel === 'MEDIUM').length,
      LOW: riskAssessments.filter(r => r.riskLevel === 'LOW').length,
    };

    // Top critical positions with coverage
    const topCritical = await prisma.position.findMany({
      where: { isCritical: true },
      include: {
        orgUnit: true,
        successors: { select: { id: true, readinessLevel: true, status: true } },
      },
      orderBy: { criticalityLevel: 'asc' },
      take: 5,
    });

    res.json({
      totalEmployees,
      totalPositions,
      totalSuccessors,
      criticalPositions: criticalPositions.length,
      successionCoverage,
      highRiskRoles,
      retirementExposure,
      readinessDistribution,
      riskBreakdown,
      topCriticalPositions: topCritical.map(p => ({
        id: p.id,
        jobTitle: p.jobTitle,
        department: p.orgUnit?.name || 'N/A',
        criticalityLevel: p.criticalityLevel,
        successorCount: p.successors.length,
        hasCoverage: p.successors.length > 0,
        readyNowCount: p.successors.filter(s => s.readinessLevel === 'READY_NOW').length,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

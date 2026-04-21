import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/employees
router.get('/', authenticate, async (req, res) => {
  try {
    const { orgUnitId } = req.query;
    const where = {};
    if (orgUnitId) where.orgUnitId = orgUnitId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        orgUnit: true,
        retirementProfile: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        orgUnit: true,
        retirementProfile: true,
        successions: { include: { position: true } },
        talentPoolMembers: { include: { talentPool: true } },
        riskAssessments: { include: { position: true } },
      },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, email, jobTitle, orgUnitId, location, yearsOfService, retirementProfile } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

    const employee = await prisma.employee.create({
      data: {
        name, email, jobTitle,
        orgUnitId: orgUnitId || null,
        location,
        yearsOfService: yearsOfService || 0,
        ...(retirementProfile ? {
          retirementProfile: {
            create: {
              yearsToRetirement: retirementProfile.yearsToRetirement,
              category: retirementProfile.category,
            },
          },
        } : {}),
      },
      include: { orgUnit: true, retirementProfile: true },
    });
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { name, email, jobTitle, orgUnitId, location, yearsOfService, retirementProfile } = req.body;
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        name, email, jobTitle,
        orgUnitId: orgUnitId || null,
        location,
        yearsOfService: yearsOfService || 0,
      },
      include: { orgUnit: true, retirementProfile: true },
    });

    if (retirementProfile) {
      await prisma.retirementProfile.upsert({
        where: { employeeId: req.params.id },
        update: {
          yearsToRetirement: retirementProfile.yearsToRetirement,
          category: retirementProfile.category,
        },
        create: {
          employeeId: req.params.id,
          yearsToRetirement: retirementProfile.yearsToRetirement,
          category: retirementProfile.category,
        },
      });
    }

    const updated = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { orgUnit: true, retirementProfile: true },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Employee not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

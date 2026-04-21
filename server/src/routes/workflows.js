import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const STATUS_ORDER = ['DRAFT', 'REVIEW', 'APPROVAL', 'FINALIZED'];

// GET /api/workflows
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const workflows = await prisma.workflowApproval.findMany({
      where,
      include: {
        position: { include: { orgUnit: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workflows/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workflow = await prisma.workflowApproval.findUnique({
      where: { id: req.params.id },
      include: {
        position: { include: { orgUnit: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workflows
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { entityType, entityId, positionId, notes } = req.body;
    if (!entityType || !entityId) return res.status(400).json({ error: 'entityType and entityId required' });
    const workflow = await prisma.workflowApproval.create({
      data: {
        entityType,
        entityId,
        positionId: positionId || null,
        status: 'DRAFT',
        approverId: req.user.id,
        notes,
      },
      include: {
        position: { include: { orgUnit: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workflows/:id/advance
router.put('/:id/advance', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const workflow = await prisma.workflowApproval.findUnique({ where: { id: req.params.id } });
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    const currentIdx = STATUS_ORDER.indexOf(workflow.status);
    if (currentIdx === STATUS_ORDER.length - 1) {
      return res.status(400).json({ error: 'Workflow already finalized' });
    }
    const nextStatus = STATUS_ORDER[currentIdx + 1];
    const updated = await prisma.workflowApproval.update({
      where: { id: req.params.id },
      data: { status: nextStatus, approverId: req.user.id, notes: req.body.notes },
      include: {
        position: { include: { orgUnit: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workflows/:id/reject
router.put('/:id/reject', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res) => {
  try {
    const updated = await prisma.workflowApproval.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT', approverId: req.user.id, notes: req.body.notes },
      include: {
        position: { include: { orgUnit: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workflows/:id
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.workflowApproval.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Workflow not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;

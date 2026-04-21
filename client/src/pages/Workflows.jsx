import { useEffect, useState } from 'react';
import { PlusIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_ORDER = ['DRAFT', 'REVIEW', 'APPROVAL', 'FINALIZED'];
const statusColor = { DRAFT: 'gray', REVIEW: 'yellow', APPROVAL: 'blue', FINALIZED: 'green' };

function WorkflowStepper({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              done ? 'bg-green-100 text-green-700' :
              active ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done && <CheckIcon className="h-3 w-3" />}
              {s}
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <ArrowRightIcon className={`h-3 w-3 mx-0.5 ${i < currentIdx ? 'text-green-500' : 'text-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Workflows() {
  const { hasRole } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ entityType: 'Successor', entityId: '', positionId: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR', 'MANAGER');

  const load = async () => {
    try {
      const [wRes, pRes] = await Promise.all([api.get('/workflows'), api.get('/positions')]);
      setWorkflows(wRes.data);
      setPositions(pRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdvance = async (wf) => {
    try {
      await api.put(`/workflows/${wf.id}/advance`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Advance failed');
    }
  };

  const handleReject = async (wf) => {
    const notes = window.prompt('Reason for rejection:');
    if (notes === null) return;
    try {
      await api.put(`/workflows/${wf.id}/reject`, { notes });
      load();
    } catch (e) {
      alert('Reject failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/workflows', form);
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterStatus ? workflows.filter(w => w.status === filterStatus) : workflows;

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Workflow Approvals</h2>
          <p className="text-sm text-gray-500">{workflows.length} workflows</p>
        </div>
        {canEdit && (
          <button onClick={() => setModalOpen(true)} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> New Workflow
          </button>
        )}
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-400">No workflows found.</div>
        ) : (
          filtered.map(wf => (
            <div key={wf.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge label={wf.entityType} color="blue" size="xs" />
                    <Badge label={wf.status} color={statusColor[wf.status]} size="xs" />
                  </div>
                  {wf.position && (
                    <p className="text-sm font-medium text-gray-900">{wf.position.jobTitle}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">
                    Entity ID: {wf.entityId.slice(0, 8)}...
                    {wf.approver && ` • Assigned to: ${wf.approver.name}`}
                  </p>
                  {wf.notes && <p className="text-xs text-gray-600 mt-1 italic">"{wf.notes}"</p>}
                  <p className="text-xs text-gray-400 mt-1">Updated {new Date(wf.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <WorkflowStepper currentStatus={wf.status} />
                  {canEdit && wf.status !== 'FINALIZED' && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => handleAdvance(wf)} className="btn-primary text-xs py-1 px-2">
                        Advance →
                      </button>
                      <button onClick={() => handleReject(wf)} className="btn-danger text-xs py-1 px-2">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Workflow">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Entity Type</label>
            <input className="input" value={form.entityType} onChange={e => setForm({ ...form, entityType: e.target.value })} required />
          </div>
          <div>
            <label className="label">Entity ID</label>
            <input className="input" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })} required placeholder="UUID of the entity" />
          </div>
          <div>
            <label className="label">Position (optional)</label>
            <select className="input" value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })}>
              <option value="">— None —</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.jobTitle}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

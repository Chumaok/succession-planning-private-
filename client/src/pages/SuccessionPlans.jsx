import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const readinessColor = { READY_NOW: 'green', READY_1_2_YEARS: 'blue', READY_3_5_YEARS: 'yellow' };
const readinessLabel = { READY_NOW: 'Ready Now', READY_1_2_YEARS: '1-2 Years', READY_3_5_YEARS: '3-5 Years' };
const statusColor = { DRAFT: 'gray', REVIEW: 'yellow', APPROVAL: 'blue', FINALIZED: 'green' };
const critColor = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };

function RatingDots({ value, max = 5, color = 'yellow' }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`h-2.5 w-2.5 rounded-full ${i < value ? (color === 'yellow' ? 'bg-yellow-400' : 'bg-blue-500') : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

export default function SuccessionPlans() {
  const { hasRole, user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedPos, setSelectedPos] = useState(null);
  const [successors, setSuccessors] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSuc, setLoadingSuc] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    employeeId: '', positionId: '', isPrimary: false, readinessLevel: 'READY_3_5_YEARS',
    performanceRating: 3, potentialRating: 3, strengths: '', developmentAreas: '',
    leadershipPotential: '', mobility: false, status: 'DRAFT',
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR', 'MANAGER');

  const loadPositions = async () => {
    try {
      const r = await api.get('/positions?isCritical=true');
      setPositions(r.data);
      const empR = await api.get('/employees');
      setEmployees(empR.data);
    } finally {
      setLoading(false);
    }
  };

  const loadSuccessors = async (posId) => {
    setLoadingSuc(true);
    try {
      const r = await api.get(`/successors?positionId=${posId}`);
      setSuccessors(r.data);
    } finally {
      setLoadingSuc(false);
    }
  };

  const loadComments = async (successorId) => {
    try {
      const r = await api.get(`/successors/${successorId}/comments`);
      setComments(prev => ({ ...prev, [successorId]: r.data }));
    } catch {}
  };

  useEffect(() => { loadPositions(); }, []);

  const selectPosition = (pos) => {
    setSelectedPos(pos);
    loadSuccessors(pos.id);
  };

  const openCreate = () => {
    if (!selectedPos) return;
    setEditing(null);
    setForm({
      employeeId: '', positionId: selectedPos.id, isPrimary: false, readinessLevel: 'READY_3_5_YEARS',
      performanceRating: 3, potentialRating: 3, strengths: '', developmentAreas: '',
      leadershipPotential: '', mobility: false, status: 'DRAFT',
    });
    setModalOpen(true);
  };

  const openEdit = (suc) => {
    setEditing(suc);
    setForm({
      employeeId: suc.employeeId, positionId: suc.positionId,
      isPrimary: suc.isPrimary, readinessLevel: suc.readinessLevel,
      performanceRating: suc.performanceRating, potentialRating: suc.potentialRating,
      strengths: suc.strengths || '', developmentAreas: suc.developmentAreas || '',
      leadershipPotential: suc.leadershipPotential || '', mobility: suc.mobility,
      status: suc.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (suc) => {
    if (!window.confirm('Remove this successor?')) return;
    try {
      await api.delete(`/successors/${suc.id}`);
      loadSuccessors(selectedPos.id);
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/successors/${editing.id}`, form);
      } else {
        await api.post('/successors', form);
      }
      setModalOpen(false);
      loadSuccessors(selectedPos.id);
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStatus = async (suc) => {
    const statusOrder = ['DRAFT', 'REVIEW', 'APPROVAL', 'FINALIZED'];
    const idx = statusOrder.indexOf(suc.status);
    if (idx === statusOrder.length - 1) return;
    const nextStatus = statusOrder[idx + 1];
    try {
      await api.put(`/successors/${suc.id}`, { ...suc, status: nextStatus, employeeId: suc.employeeId, positionId: suc.positionId });
      loadSuccessors(selectedPos.id);
    } catch (e) {
      alert('Status update failed');
    }
  };

  const openComments = async (suc) => {
    setSelectedSuccessor(suc);
    await loadComments(suc.id);
    setCommentModalOpen(true);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/successors/${selectedSuccessor.id}/comments`, { content: commentText });
      setCommentText('');
      loadComments(selectedSuccessor.id);
    } catch (e) {
      alert('Failed to add comment');
    }
  };

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Positions List */}
      <div className="w-72 flex-shrink-0">
        <div className="card overflow-hidden h-full">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">Critical Positions ({positions.length})</p>
          </div>
          <div className="overflow-y-auto">
            {positions.map(pos => (
              <button
                key={pos.id}
                onClick={() => selectPosition(pos)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${selectedPos?.id === pos.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50'}`}
              >
                <p className="text-sm font-medium text-gray-900">{pos.jobTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={pos.criticalityLevel} color={critColor[pos.criticalityLevel]} size="xs" />
                  <span className="text-xs text-gray-500">{pos.successorCount} successors</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{pos.orgUnit?.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Successors */}
      <div className="flex-1 min-w-0">
        {!selectedPos ? (
          <div className="card flex items-center justify-center h-64 text-gray-400">
            <p className="text-sm">Select a critical position to view its successors</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedPos.jobTitle}</h2>
                <p className="text-sm text-gray-500">{selectedPos.orgUnit?.name} • {selectedPos.location}</p>
              </div>
              {canEdit && (
                <button onClick={openCreate} className="btn-primary gap-1">
                  <PlusIcon className="h-4 w-4" /> Add Successor
                </button>
              )}
            </div>

            {loadingSuc ? (
              <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
            ) : successors.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">No successors assigned to this position yet.</div>
            ) : (
              successors.map(suc => (
                <div key={suc.id} className="card p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{suc.employee?.name}</h3>
                        {suc.isPrimary && <Badge label="Primary" color="blue" size="xs" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{suc.employee?.jobTitle} • {suc.employee?.orgUnit?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={readinessLabel[suc.readinessLevel]} color={readinessColor[suc.readinessLevel]} />
                      <Badge label={suc.status} color={statusColor[suc.status]} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 font-medium">Performance:</span>
                      <div className="mt-1"><RatingDots value={suc.performanceRating} color="yellow" /></div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Potential:</span>
                      <div className="mt-1"><RatingDots value={suc.potentialRating} color="blue" /></div>
                    </div>
                    {suc.strengths && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Strengths:</span>
                        <p className="text-gray-700 mt-0.5">{suc.strengths}</p>
                      </div>
                    )}
                    {suc.developmentAreas && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Development Areas:</span>
                        <p className="text-gray-700 mt-0.5">{suc.developmentAreas}</p>
                      </div>
                    )}
                    {suc.leadershipPotential && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Leadership Potential:</span>
                        <p className="text-gray-700 mt-0.5">{suc.leadershipPotential}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 font-medium">Mobility:</span>
                      <span className="ml-1 text-gray-700">{suc.mobility ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => openEdit(suc)} className="btn-secondary text-xs py-1 px-2 gap-1">
                        <PencilIcon className="h-3 w-3" /> Edit
                      </button>
                      {suc.status !== 'FINALIZED' && (
                        <button onClick={() => handleAdvanceStatus(suc)} className="btn-primary text-xs py-1 px-2">
                          Advance →
                        </button>
                      )}
                      <button onClick={() => openComments(suc)} className="btn-secondary text-xs py-1 px-2 gap-1">
                        <ChatBubbleLeftIcon className="h-3 w-3" />
                        Comments {comments[suc.id] ? `(${comments[suc.id].length})` : ''}
                      </button>
                      <button onClick={() => handleDelete(suc)} className="ml-auto p-1 text-gray-400 hover:text-red-600 rounded">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Successor Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Successor' : 'Add Successor'} size="xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Employee</label>
              <select className="input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.jobTitle})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Readiness Level</label>
              <select className="input" value={form.readinessLevel} onChange={e => setForm({ ...form, readinessLevel: e.target.value })}>
                <option value="READY_NOW">Ready Now</option>
                <option value="READY_1_2_YEARS">Ready in 1-2 Years</option>
                <option value="READY_3_5_YEARS">Ready in 3-5 Years</option>
              </select>
            </div>
            <div>
              <label className="label">Performance Rating (1-5)</label>
              <input className="input" type="number" min={1} max={5} value={form.performanceRating} onChange={e => setForm({ ...form, performanceRating: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Potential Rating (1-5)</label>
              <input className="input" type="number" min={1} max={5} value={form.potentialRating} onChange={e => setForm({ ...form, potentialRating: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="REVIEW">Review</option>
                <option value="APPROVAL">Approval</option>
                <option value="FINALIZED">Finalized</option>
              </select>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="h-4 w-4 rounded" />
                <label htmlFor="isPrimary" className="text-sm text-gray-700">Primary Successor</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mobility" checked={form.mobility} onChange={e => setForm({ ...form, mobility: e.target.checked })} className="h-4 w-4 rounded" />
                <label htmlFor="mobility" className="text-sm text-gray-700">Mobile</label>
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">Strengths</label>
              <textarea className="input" rows={2} value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Development Areas</label>
              <textarea className="input" rows={2} value={form.developmentAreas} onChange={e => setForm({ ...form, developmentAreas: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Leadership Potential</label>
              <textarea className="input" rows={2} value={form.leadershipPotential} onChange={e => setForm({ ...form, leadershipPotential: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Comments Modal */}
      <Modal isOpen={commentModalOpen} onClose={() => setCommentModalOpen(false)} title={`Comments — ${selectedSuccessor?.employee?.name}`} size="lg">
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-3">
            {(comments[selectedSuccessor?.id] || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
            ) : (
              (comments[selectedSuccessor?.id] || []).map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{c.author?.name}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn-primary">Post</button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

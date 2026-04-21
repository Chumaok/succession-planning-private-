import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const riskColor = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };

function ScoreBar({ value, max = 10, color = 'blue' }) {
  const pct = Math.round((value / max) * 100);
  const barColor = color === 'red' ? 'bg-red-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${barColor} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}

export default function RiskAssessments() {
  const { hasRole } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    positionId: '', employeeId: '', riskLevel: 'LOW',
    flightRiskScore: 5, engagementScore: 7, marketDemand: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR', 'MANAGER');

  const load = async () => {
    try {
      const [assRes, posRes, empRes] = await Promise.all([
        api.get('/risk-assessments'),
        api.get('/positions'),
        api.get('/employees'),
      ]);
      setAssessments(assRes.data);
      setPositions(posRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ positionId: '', employeeId: '', riskLevel: 'LOW', flightRiskScore: 5, engagementScore: 7, marketDemand: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      positionId: a.positionId, employeeId: a.employeeId || '',
      riskLevel: a.riskLevel, flightRiskScore: a.flightRiskScore,
      engagementScore: a.engagementScore, marketDemand: a.marketDemand || '',
      notes: a.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (a) => {
    if (!window.confirm('Delete this risk assessment?')) return;
    try {
      await api.delete(`/risk-assessments/${a.id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/risk-assessments/${editing.id}`, form);
      } else {
        await api.post('/risk-assessments', form);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterRisk ? assessments.filter(a => a.riskLevel === filterRisk) : assessments;

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Risk Assessments</h2>
          <p className="text-sm text-gray-500">{assessments.length} assessments</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> Add Assessment
          </button>
        )}
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input w-auto" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Position', 'Department', 'Employee', 'Risk Level', 'Flight Risk', 'Engagement', 'Market Demand', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No assessments found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.position?.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.position?.orgUnit?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.employee?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge label={a.riskLevel} color={riskColor[a.riskLevel]} /></td>
                  <td className="px-4 py-3 w-32">
                    <ScoreBar value={a.flightRiskScore} color={a.flightRiskScore >= 7 ? 'red' : a.flightRiskScore >= 4 ? 'yellow' : 'green'} />
                  </td>
                  <td className="px-4 py-3 w-32">
                    <ScoreBar value={a.engagementScore} color={a.engagementScore >= 7 ? 'green' : a.engagementScore >= 4 ? 'yellow' : 'red'} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.marketDemand || '—'}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(a)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(a)} className="p-1 text-gray-400 hover:text-red-600 rounded"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Risk Assessment' : 'Add Risk Assessment'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <select className="input" value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })} required>
                <option value="">— Select Position —</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.jobTitle}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Employee (optional)</label>
              <select className="input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">— None —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Risk Level</label>
              <select className="input" value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="label">Market Demand</label>
              <input className="input" value={form.marketDemand} onChange={e => setForm({ ...form, marketDemand: e.target.value })} />
            </div>
            <div>
              <label className="label">Flight Risk Score (0-10)</label>
              <input className="input" type="number" min={0} max={10} value={form.flightRiskScore} onChange={e => setForm({ ...form, flightRiskScore: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Engagement Score (0-10)</label>
              <input className="input" type="number" min={0} max={10} value={form.engagementScore} onChange={e => setForm({ ...form, engagementScore: parseInt(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

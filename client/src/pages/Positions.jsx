import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const critColor = { HIGH: 'red', MEDIUM: 'yellow', LOW: 'green' };

export default function Positions() {
  const { hasRole } = useAuth();
  const [positions, setPositions] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCrit, setFilterCrit] = useState('');
  const [filterCritical, setFilterCritical] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    jobTitle: '', orgUnitId: '', location: '', isCritical: false,
    criticalityLevel: 'LOW', description: '', competencies: '', skills: '',
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR');

  const load = async () => {
    try {
      const [posRes, orgRes] = await Promise.all([api.get('/positions'), api.get('/org-units')]);
      setPositions(posRes.data);
      setOrgUnits(orgRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ jobTitle: '', orgUnitId: '', location: '', isCritical: false, criticalityLevel: 'LOW', description: '', competencies: '', skills: '' });
    setModalOpen(true);
  };

  const openEdit = (pos) => {
    setEditing(pos);
    setForm({
      jobTitle: pos.jobTitle,
      orgUnitId: pos.orgUnitId || '',
      location: pos.location || '',
      isCritical: pos.isCritical,
      criticalityLevel: pos.criticalityLevel,
      description: pos.description || '',
      competencies: (pos.competencies || []).join(', '),
      skills: (pos.skills || []).join(', '),
    });
    setModalOpen(true);
  };

  const handleDelete = async (pos) => {
    if (!window.confirm(`Delete "${pos.jobTitle}"?`)) return;
    try {
      await api.delete(`/positions/${pos.id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      competencies: form.competencies ? form.competencies.split(',').map(s => s.trim()).filter(Boolean) : [],
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing) {
        await api.put(`/positions/${editing.id}`, payload);
      } else {
        await api.post('/positions', payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = positions.filter(p => {
    const matchSearch = !search || p.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchCrit = !filterCrit || p.criticalityLevel === filterCrit;
    const matchCritical = filterCritical === '' ? true : (filterCritical === 'true' ? p.isCritical : !p.isCritical);
    const matchDept = !filterDept || p.orgUnitId === filterDept;
    return matchSearch && matchCrit && matchCritical && matchDept;
  });

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Positions</h2>
          <p className="text-sm text-gray-500">{positions.length} positions total</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> Add Position
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search positions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCritical} onChange={e => setFilterCritical(e.target.value)}>
          <option value="">All Types</option>
          <option value="true">Critical Only</option>
          <option value="false">Non-Critical</option>
        </select>
        <select className="input w-auto" value={filterCrit} onChange={e => setFilterCrit(e.target.value)}>
          <option value="">All Criticality</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Job Title', 'Department', 'Location', 'Critical', 'Level', 'Successors', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No positions found.</td></tr>
              ) : filtered.map(pos => (
                <tr key={pos.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{pos.jobTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.orgUnit?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.location || '—'}</td>
                  <td className="px-4 py-3">
                    {pos.isCritical ? <Badge label="Critical" color="red" /> : <Badge label="Standard" color="gray" />}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={pos.criticalityLevel} color={critColor[pos.criticalityLevel] || 'gray'} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{pos.successorCount}</td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(pos)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(pos)} className="p-1 text-gray-400 hover:text-red-600 rounded"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Position' : 'Add Position'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Job Title</label>
              <input className="input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required />
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.orgUnitId} onChange={e => setForm({ ...form, orgUnitId: e.target.value })}>
                <option value="">— None —</option>
                {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Criticality Level</label>
              <select className="input" value={form.criticalityLevel} onChange={e => setForm({ ...form, criticalityLevel: e.target.value })}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="isCritical" checked={form.isCritical} onChange={e => setForm({ ...form, isCritical: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="isCritical" className="text-sm font-medium text-gray-700">Mark as Critical</label>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Competencies (comma-separated)</label>
              <input className="input" value={form.competencies} onChange={e => setForm({ ...form, competencies: e.target.value })} />
            </div>
            <div>
              <label className="label">Skills (comma-separated)</label>
              <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
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

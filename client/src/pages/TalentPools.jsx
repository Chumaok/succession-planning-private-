import { useEffect, useState } from 'react';
import { PlusIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const poolTypeColor = { ROLE_TYPE: 'blue', SKILL_GROUP: 'green', LEADERSHIP_TRACK: 'purple' };
const poolTypeLabel = { ROLE_TYPE: 'Role Type', SKILL_GROUP: 'Skill Group', LEADERSHIP_TRACK: 'Leadership Track' };

function ProgressBar({ value }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 40 ? 'bg-blue-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function TalentPools() {
  const { hasRole } = useAuth();
  const [pools, setPools] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState(null);
  const [poolForm, setPoolForm] = useState({ name: '', poolType: 'SKILL_GROUP', description: '' });
  const [memberForm, setMemberForm] = useState({ employeeId: '', developmentPlan: '', trainingProgress: 0 });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR');

  const load = async () => {
    try {
      const [poolRes, empRes] = await Promise.all([api.get('/talent-pools'), api.get('/employees')]);
      setPools(poolRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refreshSelected = async () => {
    if (selectedPool) {
      const r = await api.get(`/talent-pools/${selectedPool.id}`);
      setSelectedPool(r.data);
    }
    await load();
  };

  const openCreatePool = () => {
    setEditingPool(null);
    setPoolForm({ name: '', poolType: 'SKILL_GROUP', description: '' });
    setPoolModalOpen(true);
  };

  const openEditPool = (pool) => {
    setEditingPool(pool);
    setPoolForm({ name: pool.name, poolType: pool.poolType, description: pool.description || '' });
    setPoolModalOpen(true);
  };

  const handleSavePool = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPool) {
        await api.put(`/talent-pools/${editingPool.id}`, poolForm);
      } else {
        await api.post('/talent-pools', poolForm);
      }
      setPoolModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePool = async (pool) => {
    if (!window.confirm(`Delete "${pool.name}"?`)) return;
    try {
      await api.delete(`/talent-pools/${pool.id}`);
      if (selectedPool?.id === pool.id) setSelectedPool(null);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/talent-pools/${selectedPool.id}/members`, {
        ...memberForm,
        trainingProgress: parseInt(memberForm.trainingProgress) || 0,
      });
      setMemberModalOpen(false);
      refreshSelected();
    } catch (e) {
      alert(e.response?.data?.error || 'Add member failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (employeeId) => {
    if (!window.confirm('Remove this member from the pool?')) return;
    try {
      await api.delete(`/talent-pools/${selectedPool.id}/members/${employeeId}`);
      refreshSelected();
    } catch (e) {
      alert('Remove failed');
    }
  };

  const existingMemberIds = selectedPool?.members?.map(m => m.employeeId) || [];
  const availableEmployees = employees.filter(e => !existingMemberIds.includes(e.id));

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Talent Pools</h2>
          <p className="text-sm text-gray-500">{pools.length} pools</p>
        </div>
        {canEdit && (
          <button onClick={openCreatePool} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> Create Pool
          </button>
        )}
      </div>

      {/* Pool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map(pool => (
          <div
            key={pool.id}
            className={`card p-5 cursor-pointer transition-all ${selectedPool?.id === pool.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setSelectedPool(pool)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{pool.name}</h3>
                <Badge label={poolTypeLabel[pool.poolType]} color={poolTypeColor[pool.poolType]} size="xs" />
              </div>
              {canEdit && (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEditPool(pool)} className="p-1 text-gray-400 hover:text-blue-600 rounded text-xs">Edit</button>
                  <button onClick={() => handleDeletePool(pool)} className="p-1 text-gray-400 hover:text-red-600 rounded text-xs">Del</button>
                </div>
              )}
            </div>
            {pool.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pool.description}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{pool.members?.length || 0} members</span>
              <div className="flex -space-x-2">
                {(pool.members || []).slice(0, 4).map(m => (
                  <div key={m.id} className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold" title={m.employee?.name}>
                    {m.employee?.name?.[0] || '?'}
                  </div>
                ))}
                {(pool.members?.length || 0) > 4 && (
                  <div className="h-6 w-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs">
                    +{pool.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Pool Detail */}
      {selectedPool && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{selectedPool.name} — Members</h3>
              <Badge label={poolTypeLabel[selectedPool.poolType]} color={poolTypeColor[selectedPool.poolType]} size="xs" />
            </div>
            {canEdit && (
              <button onClick={() => {
                setMemberForm({ employeeId: '', developmentPlan: '', trainingProgress: 0 });
                setMemberModalOpen(true);
              }} className="btn-primary text-xs py-1.5 px-3 gap-1">
                <UserPlusIcon className="h-3.5 w-3.5" /> Add Member
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Job Title', 'Department', 'Development Plan', 'Progress', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(selectedPool.members || []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No members yet.</td></tr>
                ) : (
                  selectedPool.members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.employee?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{m.employee?.jobTitle || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{m.employee?.orgUnit?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{m.developmentPlan || '—'}</td>
                      <td className="px-4 py-3 w-36"><ProgressBar value={m.trainingProgress} /></td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <button onClick={() => handleRemoveMember(m.employeeId)} className="text-gray-400 hover:text-red-600">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pool Modal */}
      <Modal isOpen={poolModalOpen} onClose={() => setPoolModalOpen(false)} title={editingPool ? 'Edit Pool' : 'Create Talent Pool'}>
        <form onSubmit={handleSavePool} className="space-y-4">
          <div>
            <label className="label">Pool Name</label>
            <input className="input" value={poolForm.name} onChange={e => setPoolForm({ ...poolForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={poolForm.poolType} onChange={e => setPoolForm({ ...poolForm, poolType: e.target.value })}>
              <option value="ROLE_TYPE">Role Type</option>
              <option value="SKILL_GROUP">Skill Group</option>
              <option value="LEADERSHIP_TRACK">Leadership Track</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={poolForm.description} onChange={e => setPoolForm({ ...poolForm, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPoolModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={memberModalOpen} onClose={() => setMemberModalOpen(false)} title="Add Pool Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Employee</label>
            <select className="input" value={memberForm.employeeId} onChange={e => setMemberForm({ ...memberForm, employeeId: e.target.value })} required>
              <option value="">— Select Employee —</option>
              {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.jobTitle})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Development Plan</label>
            <textarea className="input" rows={3} value={memberForm.developmentPlan} onChange={e => setMemberForm({ ...memberForm, developmentPlan: e.target.value })} />
          </div>
          <div>
            <label className="label">Training Progress (%)</label>
            <input className="input" type="number" min={0} max={100} value={memberForm.trainingProgress} onChange={e => setMemberForm({ ...memberForm, trainingProgress: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMemberModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

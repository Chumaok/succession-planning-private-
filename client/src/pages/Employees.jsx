import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const retirementColor = { IMMEDIATE: 'red', MID_TERM: 'yellow', LONG_TERM: 'green' };
const retirementLabel = { IMMEDIATE: 'Immediate', MID_TERM: 'Mid-Term', LONG_TERM: 'Long-Term' };

export default function Employees() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', jobTitle: '', orgUnitId: '', location: '',
    yearsOfService: 0, hasRetirement: false,
    retirementYears: 5, retirementCategory: 'LONG_TERM',
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole('ADMIN', 'HR');

  const load = async () => {
    try {
      const [empRes, orgRes] = await Promise.all([api.get('/employees'), api.get('/org-units')]);
      setEmployees(empRes.data);
      setOrgUnits(orgRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', jobTitle: '', orgUnitId: '', location: '', yearsOfService: 0, hasRetirement: false, retirementYears: 5, retirementCategory: 'LONG_TERM' });
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      jobTitle: emp.jobTitle || '',
      orgUnitId: emp.orgUnitId || '',
      location: emp.location || '',
      yearsOfService: emp.yearsOfService || 0,
      hasRetirement: !!emp.retirementProfile,
      retirementYears: emp.retirementProfile?.yearsToRetirement || 5,
      retirementCategory: emp.retirementProfile?.category || 'LONG_TERM',
    });
    setModalOpen(true);
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete "${emp.name}"?`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, email: form.email, jobTitle: form.jobTitle,
      orgUnitId: form.orgUnitId || null, location: form.location,
      yearsOfService: parseInt(form.yearsOfService) || 0,
      ...(form.hasRetirement ? {
        retirementProfile: { yearsToRetirement: parseInt(form.retirementYears), category: form.retirementCategory }
      } : {}),
    };
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || e.orgUnitId === filterDept;
    return matchSearch && matchDept;
  });

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500">{employees.length} employees</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> Add Employee
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {orgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Job Title', 'Department', 'Location', 'Years', 'Retirement', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No employees found.</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.jobTitle || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.orgUnit?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.location || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{emp.yearsOfService}y</td>
                  <td className="px-4 py-3">
                    {emp.retirementProfile ? (
                      <Badge
                        label={`${retirementLabel[emp.retirementProfile.category]} (${emp.retirementProfile.yearsToRetirement}y)`}
                        color={retirementColor[emp.retirementProfile.category]}
                      />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(emp)} className="p-1 text-gray-400 hover:text-blue-600 rounded"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(emp)} className="p-1 text-gray-400 hover:text-red-600 rounded"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Job Title</label>
              <input className="input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} />
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
              <label className="label">Years of Service</label>
              <input className="input" type="number" min={0} value={form.yearsOfService} onChange={e => setForm({ ...form, yearsOfService: e.target.value })} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="hasRetire" checked={form.hasRetirement} onChange={e => setForm({ ...form, hasRetirement: e.target.checked })} className="h-4 w-4 rounded" />
                <label htmlFor="hasRetire" className="text-sm font-medium text-gray-700">Has Retirement Profile</label>
              </div>
            </div>
            {form.hasRetirement && (
              <>
                <div>
                  <label className="label">Years to Retirement</label>
                  <input className="input" type="number" min={0} value={form.retirementYears} onChange={e => setForm({ ...form, retirementYears: e.target.value })} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.retirementCategory} onChange={e => setForm({ ...form, retirementCategory: e.target.value })}>
                    <option value="IMMEDIATE">Immediate (&lt;3 years)</option>
                    <option value="MID_TERM">Mid-Term (3-5 years)</option>
                    <option value="LONG_TERM">Long-Term (5+ years)</option>
                  </select>
                </div>
              </>
            )}
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

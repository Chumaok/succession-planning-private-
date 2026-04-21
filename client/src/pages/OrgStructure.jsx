import { useEffect, useState } from 'react';
import {
  ChevronDownIcon, ChevronRightIcon, PlusIcon, PencilIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import api from '../api/axios.js';
import Modal from '../components/Modal.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const typeColors = {
  COMPANY: 'blue', REGION: 'purple', DIVISION: 'indigo',
  DEPARTMENT: 'green', TEAM: 'orange',
};

const ORG_TYPES = ['COMPANY', 'REGION', 'DIVISION', 'DEPARTMENT', 'TEAM'];

function OrgNode({ node, allUnits, onEdit, onDelete, canEdit, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex items-center gap-2 py-2 group">
        <button
          onClick={() => setOpen(!open)}
          className={`text-gray-400 ${hasChildren ? 'hover:text-gray-600' : 'opacity-0 pointer-events-none'}`}
        >
          {open ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>
        <Badge label={node.type} color={typeColors[node.type] || 'gray'} />
        <span className="text-sm font-medium text-gray-800">{node.name}</span>
        {canEdit && (
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(node)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(node)} className="p-1 text-gray-400 hover:text-red-600 rounded">
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {open && hasChildren && (
        <div>
          {node.children.map(child => (
            <OrgNode key={child.id} node={child} allUnits={allUnits} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgStructure() {
  const { hasRole } = useAuth();
  const [tree, setTree] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'DEPARTMENT', parentId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canEdit = hasRole('ADMIN', 'HR');

  const load = async () => {
    try {
      const [treeRes, allRes] = await Promise.all([
        api.get('/org-units/tree'),
        api.get('/org-units'),
      ]);
      setTree(treeRes.data);
      setAllUnits(allRes.data);
    } catch (e) {
      setError('Failed to load org structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'DEPARTMENT', parentId: '' });
    setModalOpen(true);
  };

  const openEdit = (unit) => {
    setEditing(unit);
    setForm({ name: unit.name, type: unit.type, parentId: unit.parentId || '' });
    setModalOpen(true);
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Delete "${unit.name}"? This may fail if it has children or references.`)) return;
    try {
      await api.delete(`/org-units/${unit.id}`);
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
        await api.put(`/org-units/${editing.id}`, form);
      } else {
        await api.post('/org-units', form);
      }
      setModalOpen(false);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center h-40 items-center"><div className="animate-spin h-7 w-7 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Organization Hierarchy</h2>
          <p className="text-sm text-gray-500">{allUnits.length} organizational units</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary gap-1">
            <PlusIcon className="h-4 w-4" /> Add Unit
          </button>
        )}
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      <div className="card p-6">
        {tree.map(node => (
          <OrgNode key={node.id} node={node} allUnits={allUnits} onEdit={openEdit} onDelete={handleDelete} canEdit={canEdit} />
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Org Unit' : 'Add Org Unit'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Parent Unit</label>
            <select className="input" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
              <option value="">— None (Top Level) —</option>
              {allUnits.filter(u => !editing || u.id !== editing.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
              ))}
            </select>
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

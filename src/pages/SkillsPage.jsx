import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import StatCards from '../components/common/StatCards';
import { fetchSkills, createSkill, updateSkill, removeSkill } from '../features/skills/skillsSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchInput from '../components/common/SearchInput';
import { Field, TextInput, Checkbox } from '../components/common/FormField';
import { formatDateTime } from '../utils/formatDate';

const emptyForm = { name: '', is_active: true };

// filter: '' = all skills, 'active' / 'hidden' by is_active.
const STAT_CARDS = [
  { key: 'total', label: 'Total skills', filter: '', icon: Sparkles },
  { key: 'active', label: 'Active', filter: 'active', icon: Eye },
  { key: 'hidden', label: 'Hidden', filter: 'hidden', icon: EyeOff },
];

export default function SkillsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.skills);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // null = closed, {} = creating, a skill row = editing that skill
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchSkills());
  }, [dispatch]);

  const counts = useMemo(() => {
    if ((status === 'idle' || status === 'loading') && items.length === 0) return null;
    const active = items.filter((s) => s.is_active).length;
    return { total: items.length, active, hidden: items.length - active };
  }, [items, status]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (s) =>
        (!term || s.name.toLowerCase().includes(term)) &&
        (!statusFilter || (statusFilter === 'active') === !!s.is_active),
    );
  }, [items, search, statusFilter]);

  const isEdit = !!editing?._id;

  const openCreate = () => {
    setForm(emptyForm);
    setEditing({});
  };

  const openEdit = (skill) => {
    setForm({ name: skill.name, is_active: skill.is_active });
    setEditing(skill);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const action = isEdit ? updateSkill({ id: editing._id, ...form }) : createSkill(form);
    const result = await dispatch(action);
    setSubmitting(false);
    if (!result.error) setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await dispatch(removeSkill(deleteTarget._id));
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'name', header: 'Skill' },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (row.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>),
    },
    { key: 'updatedAt', header: 'Last updated', render: (row) => formatDateTime(row.updatedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch(updateSkill({ id: row._id, is_active: !row.is_active }))}
            title={row.is_active ? 'Hide from maid forms' : 'Show on maid forms'}
          >
            {row.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEdit(row)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Skills"
        description="Skills offered when adding or editing maid profiles"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
              <Plus className="h-4 w-4" />
            </span>
            Create New Skill
          </button>
        }
      />

      <StatCards
        cards={STAT_CARDS}
        counts={counts}
        activeFilter={statusFilter}
        onSelect={setStatusFilter}
        className="xl:grid-cols-3"
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search skills…" className="mb-4 max-w-sm" />

      <Table
        columns={columns}
        rows={rows}
        loading={status === 'loading' && items.length === 0}
        rowKey="_id"
        emptyMessage={search || statusFilter ? 'No skills match these filters' : 'No skills yet'}
      />

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isEdit ? 'Edit Skill' : 'New Skill'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Name"
            required
            hint={isEdit ? 'Renaming also updates every maid profile that has this skill.' : undefined}
          >
            <TextInput
              required
              autoFocus
              maxLength={60}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Checkbox
            label="Active (shown on maid forms)"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete skill"
        message={`Delete "${deleteTarget?.name}"? It will no longer be offered on maid forms. Maid profiles that already list it keep it.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

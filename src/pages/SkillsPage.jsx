import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Eye, EyeOff, Sparkles, ArrowUp, ArrowDown, ArrowDownAZ } from 'lucide-react';
import IconActionButton from '../components/common/IconActionButton';
import StatCards from '../components/common/StatCards';
import {
  fetchSkills,
  createSkill,
  updateSkill,
  removeSkill,
  reorderSkills,
  resetSkillOrder,
} from '../features/skills/skillsSlice';
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

// Falls back to the creation time embedded in a Mongo ObjectId (first 8 hex chars = seconds).
const createdAtOf = (row) =>
  row.createdAt || (/^[0-9a-f]{24}$/i.test(row._id || '') ? new Date(parseInt(row._id.slice(0, 8), 16) * 1000) : null);

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
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  // Reordering works on the full list; with a search or filter applied, "up" would be ambiguous.
  const canReorder = !search.trim() && !statusFilter && items.length > 1;
  const positionOf = useMemo(() => new Map(items.map((s, i) => [s._id, i])), [items]);

  const move = (skill, step) => {
    const from = positionOf.get(skill._id);
    const to = from + step;
    if (to < 0 || to >= items.length) return;
    const ids = items.map((s) => s._id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    dispatch(reorderSkills(ids));
  };

  const handleResetOrder = async () => {
    setResetting(true);
    await dispatch(resetSkillOrder());
    setResetting(false);
    setConfirmReset(false);
  };

  const arrowClass =
    'rounded-lg p-1 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400';

  const columns = [
    {
      key: 'order',
      header: 'Order',
      render: (row) => {
        const index = positionOf.get(row._id);
        return (
          <div className="flex items-center gap-1">
            <span className="w-6 text-right font-mono text-xs text-gray-500">{index + 1}</span>
            <button
              type="button"
              onClick={() => move(row, -1)}
              disabled={!canReorder || index === 0}
              title="Move up"
              aria-label={`Move ${row.name} up`}
              className={arrowClass}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(row, 1)}
              disabled={!canReorder || index === items.length - 1}
              title="Move down"
              aria-label={`Move ${row.name} down`}
              className={arrowClass}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
    { key: 'name', header: 'Skill' },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (row.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(createdAtOf(row)) },
    { key: 'updatedAt', header: 'Last updated', render: (row) => formatDateTime(row.updatedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <IconActionButton
            action={row.is_active ? 'hide' : 'show'}
            label={row.is_active ? `Hide ${row.name} from maid forms` : `Show ${row.name} on maid forms`}
            onClick={() => dispatch(updateSkill({ id: row._id, is_active: !row.is_active }))}
          />
          <IconActionButton action="edit" label={`Edit ${row.name}`} onClick={() => openEdit(row)} />
          <IconActionButton action="delete" label={`Delete ${row.name}`} onClick={() => setDeleteTarget(row)} />
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search skills…" className="w-full max-w-sm" />
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500">
            {canReorder || items.length <= 1
              ? 'This order is used on the maid form.'
              : 'Clear the search and filter to change the order.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)} disabled={items.length <= 1}>
            <ArrowDownAZ className="h-4 w-4" /> Reset to A–Z
          </Button>
        </div>
      </div>

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

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetOrder}
        loading={resetting}
        variant="primary"
        title="Reset skill order"
        message="Forget the custom order and list every skill alphabetically (A–Z)?"
        confirmLabel="Reset to A–Z"
      />
    </div>
  );
}

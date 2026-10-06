import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { fetchTeam, createTeamMember, removeTeamMember, toggleSuperAdmin } from '../features/team/teamSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Field, TextInput, Select, Checkbox } from '../components/common/FormField';

const emptyForm = { name: '', email: '', password: '', confirm_password: '', role: 'A', is_super_admin: false };

export default function TeamPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.team);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchTeam());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(createTeamMember(form));
    setSubmitting(false);
    if (createTeamMember.fulfilled.match(result)) {
      setCreateOpen(false);
      setForm(emptyForm);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(removeTeamMember(deleteTarget.user_id));
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge tone="brand">{row.role}</Badge>,
    },
    {
      key: 'is_super_admin',
      header: 'Super Admin',
      render: (row) => (row.is_super_admin ? <Badge tone="green">Yes</Badge> : <Badge tone="gray">No</Badge>),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={row.status === 'active' ? 'green' : 'gray'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch(toggleSuperAdmin(row.user_id))}
            title="Toggle Super Admin status"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Team"
        description="Manage admin accounts and permissions"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Team Member
          </Button>
        }
      />

      <Table columns={columns} rows={items} loading={status === 'loading'} rowKey="user_id" />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Team Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Name" required>
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <TextInput
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Role" required>
            <Select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="A">Admin</option>
              <option value="Marketing">Marketing</option>
              <option value="Admin">Admin (legacy)</option>
            </Select>
          </Field>
          <Checkbox
            label="Grant Super Admin privileges"
            checked={form.is_super_admin}
            onChange={(e) => setForm({ ...form, is_super_admin: e.target.checked })}
          />
          <Field label="Password" required hint="6-16 characters">
            <TextInput
              type="password"
              required
              minLength={6}
              maxLength={16}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Confirm Password" required>
            <TextInput
              type="password"
              required
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove team member"
        message={`Permanently remove ${deleteTarget?.name}'s admin account?`}
        confirmLabel="Remove"
      />
    </div>
  );
}

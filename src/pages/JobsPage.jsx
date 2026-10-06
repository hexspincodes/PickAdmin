import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2 } from 'lucide-react';
import { fetchJobListings, createJobListing, deleteJobListing } from '../features/jobs/jobsSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Field, TextInput, FileInput } from '../components/common/FormField';

const emptyForm = { title: '', commitment: '', location: '', service: '', nationality: '', image: null };

export default function JobsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.jobs);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchJobListings());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await dispatch(createJobListing(form));
    setSubmitting(false);
    if (createJobListing.fulfilled.match(result)) {
      setCreateOpen(false);
      setForm(emptyForm);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteJobListing(deleteTarget._id));
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'service', header: 'Service' },
    { key: 'location', header: 'Location' },
    { key: 'nationality', header: 'Nationality' },
    { key: 'commitment', header: 'Commitment' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (row.status === 1 ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(row)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Job Listings"
        description="Job opportunities maids can apply to"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Listing
          </Button>
        }
      />

      <Table columns={columns} rows={items} loading={status === 'loading'} rowKey="_id" />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Job Listing">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Title" required>
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Service" required>
            <TextInput required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          </Field>
          <Field label="Location" required>
            <TextInput required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Nationality" required>
            <TextInput required value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          </Field>
          <Field label="Commitment" required hint="e.g. Full-time, Live-in">
            <TextInput required value={form.commitment} onChange={(e) => setForm({ ...form, commitment: e.target.value })} />
          </Field>
          <Field label="Image" required>
            <FileInput required accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
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
        title="Delete job listing"
        message={`Permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}

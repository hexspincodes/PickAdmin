import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, MessageSquare, Newspaper, CalendarDays, Heart } from 'lucide-react';
import StatCards from '../components/common/StatCards';
import { fetchAdminBlogs, createBlog, editBlog, deleteBlog, deleteBlogComment } from '../features/blog/blogSlice';
import { generateSlugFromTitle } from '../features/blog/blogAPI';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Field, TextInput, TextArea, FileInput } from '../components/common/FormField';
import { formatDate, formatDateTime } from '../utils/formatDate';

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  content: '',
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  og_title: '',
  og_description: '',
  thumbnail: null,
};

// filter: what the table shows when the card is selected ('' = every post).
const STAT_CARDS = [
  { key: 'total', label: 'Total posts', filter: '', icon: Newspaper },
  { key: 'month', label: 'This month', filter: 'month', icon: CalendarDays },
  { key: 'comments', label: 'Comments', filter: 'commented', icon: MessageSquare },
  { key: 'likes', label: 'Likes', filter: 'liked', icon: Heart },
];

const isThisMonth = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const MATCHES = {
  month: (b) => b.createdAt && isThisMonth(b.createdAt),
  commented: (b) => (b.comments?.length || 0) > 0,
  liked: (b) => (b.likes?.length || 0) > 0,
};

export default function BlogPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.blog);
  const [cardFilter, setCardFilter] = useState('');

  const counts = useMemo(() => {
    if ((status === 'idle' || status === 'loading') && items.length === 0) return null;
    return {
      total: items.length,
      month: items.filter(MATCHES.month).length,
      comments: items.reduce((sum, b) => sum + (b.comments?.length || 0), 0),
      likes: items.reduce((sum, b) => sum + (b.likes?.length || 0), 0),
    };
  }, [items, status]);

  const rows = cardFilter ? items.filter(MATCHES[cardFilter]) : items;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commentsTarget, setCommentsTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminBlogs());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (blog) => {
    setEditing(blog);
    setForm({ ...emptyForm, ...blog, thumbnail: null });
    setFormOpen(true);
  };

  const handleTitleBlur = async () => {
    if (!form.title || form.slug) return;
    try {
      const res = await generateSlugFromTitle(form.title);
      if (res.data?.slug) setForm((f) => ({ ...f, slug: res.data.slug }));
    } catch {
      // best-effort — slug field stays editable regardless
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fieldsKey = editing ? 'thumbnailFile' : 'thumbnail';
    const { thumbnail, ...rest } = form;
    const fields = { ...rest, [fieldsKey]: thumbnail || undefined };

    const result = editing
      ? await dispatch(editBlog({ id: editing.slug, fields }))
      : await dispatch(createBlog(fields));

    setSubmitting(false);
    if ((editing ? editBlog : createBlog).fulfilled.match(result)) {
      setFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteBlog(deleteTarget.slug));
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'slug', header: 'Slug' },
    { key: 'comments', header: 'Comments', render: (row) => row.comments?.length || 0 },
    { key: 'likes', header: 'Likes', render: (row) => row.likes?.length || 0 },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="secondary" size="sm" title="Comments" onClick={() => setCommentsTarget(row)}>
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button variant="secondary" size="sm" title="Edit" onClick={() => openEdit(row)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="danger" size="sm" title="Delete" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Manage blog posts and comments"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
              <Plus className="h-4 w-4" />
            </span>
            Create New Blog
          </button>
        }
      />

      <StatCards
        cards={STAT_CARDS}
        counts={counts}
        activeFilter={cardFilter}
        onSelect={setCardFilter}
        className="xl:grid-cols-4"
      />

      <Table
        columns={columns}
        rows={rows}
        loading={status === 'loading' && items.length === 0}
        rowKey="_id"
        emptyMessage={cardFilter ? 'No posts match this card' : 'No blog posts yet'}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Blog Post' : 'New Blog Post'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required>
            <TextInput
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={handleTitleBlur}
            />
          </Field>
          <Field label="Slug" required hint="Auto-filled from title when left blank">
            <TextInput required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </Field>
          <Field label="Description" required>
            <TextArea rows={2} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Content" required hint="HTML or Markdown">
            <TextArea rows={8} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Meta Title">
              <TextInput value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </Field>
            <Field label="Meta Keywords">
              <TextInput value={form.meta_keywords} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} />
            </Field>
          </div>
          <Field label="Meta Description">
            <TextArea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="OG Title">
              <TextInput value={form.og_title} onChange={(e) => setForm({ ...form, og_title: e.target.value })} />
            </Field>
            <Field label="OG Description">
              <TextInput value={form.og_description} onChange={(e) => setForm({ ...form, og_description: e.target.value })} />
            </Field>
          </div>
          <Field label="Thumbnail" required={!editing} hint={editing ? 'Leave empty to keep the current thumbnail' : undefined}>
            <FileInput required={!editing} accept="image/*" onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!commentsTarget} onClose={() => setCommentsTarget(null)} title={`Comments — ${commentsTarget?.title || ''}`}>
        {(commentsTarget?.comments?.length || 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No comments yet</p>
        ) : (
          <ul className="space-y-3">
            {commentsTarget.comments.map((c) => (
              <li key={c._id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3 text-sm">
                <div>
                  <p className="text-gray-700">{c.comment}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {c.user_id} · {c.createdAt ? formatDateTime(c.createdAt) : ''}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    await dispatch(deleteBlogComment({ slug: commentsTarget.slug, comment_id: c._id }));
                    setCommentsTarget({ ...commentsTarget, comments: commentsTarget.comments.filter((x) => x._id !== c._id) });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete blog post"
        message={`Permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
      />
    </div>
  );
}

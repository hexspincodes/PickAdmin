import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, Newspaper, CalendarDays, Heart, Search, X } from 'lucide-react';
import StatCards from '../components/common/StatCards';
import BlogReaderModal from '../components/blog/BlogReaderModal';
import { fetchAdminBlogs, createBlog, editBlog, deleteBlog } from '../features/blog/blogSlice';
import { generateSlugFromTitle, getBlogBySlug } from '../features/blog/blogAPI';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import IconActionButton from '../components/common/IconActionButton';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Field, TextInput, TextArea, FileInput } from '../components/common/FormField';
import RichTextEditor from '../components/common/RichTextEditor';
import { formatDate } from '../utils/formatDate';
import { mediaUrl } from '../utils/mediaUrl';

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
  canonical_url: '',
  thumbnail: null,
};

// Only the editable fields — the full record also carries comments/likes/_id/timestamps,
// which must not be posted back.
const toForm = (blog) =>
  Object.fromEntries(Object.keys(emptyForm).map((key) => [key, key === 'thumbnail' ? null : blog[key] ?? '']));

const blogUrl = (slug) => `https://www.pickmymaid.com/blog/${slug || 'your-post-slug'}`;

// meta_keywords is stored as one comma-separated string.
const splitKeywords = (value) =>
  [...new Set((value || '').split(',').map((k) => k.trim()).filter(Boolean))];

function CharCount({ value, limit }) {
  const length = (value || '').length;
  return (
    <span className={length > limit ? 'text-red-500' : undefined}>
      {length}/{limit} characters{length > limit ? ' — may be cut off in search results' : ''}
    </span>
  );
}

function KeywordInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const keywords = splitKeywords(value);
  const commit = () => {
    if (!draft.trim()) return;
    onChange(splitKeywords(`${value},${draft}`).join(', '));
    setDraft('');
  };
  const remove = (keyword) => onChange(keywords.filter((k) => k !== keyword).join(', '));

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
      {keywords.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-700">
          {k}
          <button type="button" onClick={() => remove(k)} className="rounded-full p-0.5 hover:bg-brand-100" aria-label={`Remove ${k}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && keywords.length) {
            remove(keywords[keywords.length - 1]);
          }
        }}
        onBlur={commit}
        placeholder={keywords.length ? '' : 'e.g. maid agency abu dhabi'}
        className="min-w-32 flex-1 border-0 bg-transparent py-0.5 text-sm outline-none focus:ring-0"
      />
    </div>
  );
}

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
  const [loadingPost, setLoadingPost] = useState(false);
  const editingSlugRef = useRef(null);
  editingSlugRef.current = formOpen ? editing?.slug ?? null : null;
  const [deleteTarget, setDeleteTarget] = useState(null);
  // { blog, comments }: the post open in the reader, and whether to jump to its comments.
  const [reading, setReading] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminBlogs());
  }, [dispatch]);

  // Object URL for the newly picked thumbnail, revoked when it changes or the form closes.
  const [thumbPreview, setThumbPreview] = useState('');
  useEffect(() => {
    if (!form.thumbnail) {
      setThumbPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(form.thumbnail);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.thumbnail]);
  const thumbSrc = thumbPreview || (editing?.thumbnail ? mediaUrl(editing.thumbnail) : '');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  // The admin list may not carry every field, so load the full post before editing.
  const openEdit = async (blog) => {
    setEditing(blog);
    setForm(toForm(blog));
    setFormOpen(true);
    setLoadingPost(true);
    try {
      const res = await getBlogBySlug(blog.slug);
      const full = res.data?.blog;
      // Ignore the response if the admin already switched to another post.
      if (full && editingSlugRef.current === blog.slug) {
        setEditing({ ...blog, ...full });
        setForm(toForm({ ...blog, ...full }));
      }
    } catch (err) {
      toast.error(`Couldn't load the full post: ${err.message}`);
    } finally {
      if (editingSlugRef.current === blog.slug) setLoadingPost(false);
    }
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
    // The rich text editor isn't a native input, so `required` can't enforce it.
    if (!form.content) {
      toast.error('Content is required');
      return;
    }
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
    {
      key: 'thumbnail',
      header: 'Image',
      render: (row) =>
        row.thumbnail ? (
          <img src={mediaUrl(row.thumbnail)} alt="" className="h-16 w-24 rounded-md object-cover" />
        ) : (
          <div className="h-16 w-24 rounded-md bg-gray-100" />
        ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div className="max-w-md">
          <p className="truncate font-medium text-gray-900">{row.title}</p>
          <p className="truncate text-xs text-gray-500">{row.description}</p>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    { key: 'editedAt', header: 'Last Edited', render: (row) => formatDate(row.editedAt || row.updatedAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          {/* stopPropagation: the row itself opens the reader. */}
          <IconActionButton
            action="comments"
            label={`Comments on ${row.title}`}
            count={row.comments?.length}
            onClick={(e) => {
              e.stopPropagation();
              setReading({ blog: row, comments: true });
            }}
          />
          <IconActionButton
            action="edit"
            label={`Edit ${row.title}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          />
          <IconActionButton
            action="delete"
            label={`Delete ${row.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          />
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
        onRowClick={(row) => setReading({ blog: row, comments: false })}
        emptyMessage={cardFilter ? 'No posts match this card' : 'No blog posts yet'}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Blog Post' : 'New Blog Post'} size="2xl" closeOnBackdrop={false}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {loadingPost && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Loading the full post…</p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
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
                <TextArea rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <Field label="Thumbnail" required={!editing} hint={editing ? 'Leave empty to keep the current thumbnail' : undefined}>
              <div className="mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                {thumbSrc ? (
                  <img src={thumbSrc} alt="Thumbnail preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No image selected</span>
                )}
              </div>
              <FileInput
                required={!editing}
                accept="image/*"
                onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] || null })}
              />
            </Field>
          </div>
          <Field label="Content" required>
            <RichTextEditor
              id="blog_content"
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              minHeight={360}
            />
          </Field>
          <section className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-brand-600" />
              <h4 className="text-sm font-semibold text-gray-900">SEO</h4>
              <span className="text-xs text-gray-400">Falls back to the title and description when left blank</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
              <div className="space-y-4">
                <Field label="Meta Title" hint={<CharCount value={form.meta_title || form.title} limit={60} />}>
                  <TextInput
                    value={form.meta_title}
                    placeholder={form.title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  />
                </Field>
                <Field label="Meta Description" hint={<CharCount value={form.meta_description || form.description} limit={160} />}>
                  <TextArea
                    rows={3}
                    value={form.meta_description}
                    placeholder={form.description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  />
                </Field>
                {/* Not <Field>: its <label> wrapper would forward clicks to the first chip's remove button. */}
                <div>
                  <span className="mb-1 block text-sm font-medium text-gray-700">Meta Keywords</span>
                  <KeywordInput value={form.meta_keywords} onChange={(v) => setForm((f) => ({ ...f, meta_keywords: v }))} />
                  <span className="mt-1 block text-xs text-gray-400">Press Enter or comma to add a keyword</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="OG Title">
                    <TextInput value={form.og_title} onChange={(e) => setForm({ ...form, og_title: e.target.value })} />
                  </Field>
                  <Field label="OG Description">
                    <TextInput value={form.og_description} onChange={(e) => setForm({ ...form, og_description: e.target.value })} />
                  </Field>
                </div>
                <Field label="Canonical URL">
                  <TextInput
                    type="url"
                    value={form.canonical_url}
                    placeholder={blogUrl(form.slug)}
                    onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                  />
                </Field>
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">Search preview</p>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="truncate text-xs text-gray-600">{form.canonical_url || blogUrl(form.slug)}</p>
                  <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">
                    {form.meta_title || form.title || 'Blog post title'}
                  </p>
                  <p className="mt-1 line-clamp-3 text-sm text-gray-600">
                    {form.meta_description || form.description || 'The meta description shows here in search results.'}
                  </p>
                </div>
                {splitKeywords(form.meta_keywords).length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-sm font-medium text-gray-700">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {splitKeywords(form.meta_keywords).map((k) => (
                        <span key={k} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={loadingPost}>
              {editing ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Modal>

      <BlogReaderModal
        blog={reading?.blog}
        scrollToComments={reading?.comments}
        onClose={() => setReading(null)}
        onEdit={(blog) => {
          setReading(null);
          openEdit(blog);
        }}
        onDelete={(blog) => {
          setReading(null);
          setDeleteTarget(blog);
        }}
      />

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

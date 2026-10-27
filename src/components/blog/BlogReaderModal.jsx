import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { CalendarDays, Heart, MessageSquare, PencilLine, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import Loader from '../common/Loader';
import IconActionButton from '../common/IconActionButton';
import { CONTENT_CLS } from '../common/RichTextEditor';
import { getBlogBySlug } from '../../features/blog/blogAPI';
import { deleteBlogComment } from '../../features/blog/blogSlice';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { mediaUrl } from '../../utils/mediaUrl';

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-gray-900 tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

/**
 * Read-only view of one post: the article as published, its like count and its comments.
 * `blog` is the table row (shown immediately); the full post is fetched by slug.
 * `scrollToComments` opens the view at the comments section.
 */
export default function BlogReaderModal({ blog, scrollToComments = false, onClose, onEdit, onDelete }) {
  const dispatch = useDispatch();
  const [full, setFull] = useState(null);
  const [status, setStatus] = useState('idle');
  const [removing, setRemoving] = useState(null);
  const commentsRef = useRef(null);

  useEffect(() => {
    if (!blog) return undefined;
    let cancelled = false;
    setFull(null);
    setStatus('loading');
    getBlogBySlug(blog.slug)
      .then((res) => {
        if (cancelled) return;
        setFull(res.data?.blog || null);
        setStatus('succeeded');
      })
      .catch(() => !cancelled && setStatus('failed'));
    return () => {
      cancelled = true;
    };
  }, [blog]);

  useEffect(() => {
    if (scrollToComments && status === 'succeeded') commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scrollToComments, status]);

  if (!blog) return null;

  const post = { ...blog, ...full };
  // The single-post endpoint returns likes as a number; the admin list returns the raw array.
  const likes = typeof post.likes === 'number' ? post.likes : post.likes?.length || 0;
  const comments = full?.comments || [];

  const removeComment = async (comment) => {
    setRemoving(comment._id);
    const result = await dispatch(deleteBlogComment({ slug: post.slug, comment_id: comment._id }));
    setRemoving(null);
    if (deleteBlogComment.fulfilled.match(result)) {
      setFull((f) => ({ ...f, comments: f.comments.filter((c) => c._id !== comment._id) }));
    }
  };

  return (
    <Modal open onClose={onClose} title="Blog post" size="2xl">
      <article className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100">
          {post.thumbnail ? (
            <img src={mediaUrl(post.thumbnail)} alt="" className="aspect-[21/9] w-full object-cover" />
          ) : (
            <div className="aspect-[21/9] w-full" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16 sm:p-7 sm:pt-24">
            <h1 className="text-xl font-bold leading-tight text-white sm:text-3xl">{post.title}</h1>
            <p className="mt-1.5 text-xs text-white/70">/blog/{post.slug}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Stat icon={Heart} label="Likes" value={status === 'loading' && !full ? '…' : likes} tone="bg-rose-50 text-rose-500" />
            <Stat icon={MessageSquare} label="Comments" value={full ? comments.length : '…'} tone="bg-violet-50 text-violet-600" />
            <Stat icon={CalendarDays} label="Created" value={formatDate(post.createdAt)} tone="bg-sky-50 text-sky-600" />
            <Stat icon={PencilLine} label="Last edited" value={formatDate(post.editedAt || post.updatedAt)} tone="bg-amber-50 text-amber-600" />
          </div>
          <div className="flex gap-2">
            <IconActionButton action="edit" label={`Edit ${post.title}`} onClick={() => onEdit(blog)} />
            <IconActionButton action="delete" label={`Delete ${post.title}`} onClick={() => onDelete(blog)} />
          </div>
        </div>

        {post.description && (
          <p className="mt-6 border-l-4 border-brand-500 pl-4 text-base italic text-gray-600">{post.description}</p>
        )}

        {status === 'loading' && !full ? (
          <Loader />
        ) : status === 'failed' ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">Couldn&apos;t load this post. Close and try again.</p>
        ) : (
          // Admin-authored HTML from our own editor, rendered with the editor's styles.
          <div
            className={`mt-6 text-[15px] leading-7 text-gray-800 ${CONTENT_CLS}`}
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        )}

        <section ref={commentsRef} className="mt-10 scroll-mt-4 border-t border-gray-200 pt-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <MessageSquare className="h-4 w-4 text-violet-600" />
            Comments
            {full && <span className="rounded-full bg-violet-50 px-2 text-xs font-medium leading-5 text-violet-700">{comments.length}</span>}
          </h2>
          {!full ? null : comments.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">No comments yet</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {comments.map((c) => (
                <li key={c._id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700">
                    {(c.user_name || '?').charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-900">{c.user_name || 'Customer'}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-gray-700">{c.comment}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeComment(c)}
                    disabled={removing === c._id}
                    title="Delete comment"
                    aria-label={`Delete comment by ${c.user_name || 'customer'}`}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </Modal>
  );
}

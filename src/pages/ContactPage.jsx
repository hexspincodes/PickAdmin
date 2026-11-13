import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deleteContact,
  fetchContacts,
  isNewContact,
  readContactsLastSeen,
  setContactsLastSeen,
  writeContactsLastSeen,
} from '../features/contact/contactSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import IconActionButton from '../components/common/IconActionButton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import { Mail, Phone, Reply } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

export default function ContactPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.contact);
  const userId = useSelector((state) => state.auth.user?.user_id);
  // Captured on arrival so the rows that were new stay marked while the admin reads them.
  const [seenBefore] = useState(() => readContactsLastSeen(userId));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  // Opening this page reads everything: clear the bell (also for messages that arrive while here).
  useEffect(() => {
    const now = Date.now();
    writeContactsLastSeen(userId, now);
    dispatch(setContactsLastSeen(now));
  }, [dispatch, userId, items]);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          {row.name}
          {isNewContact(row, seenBefore) && <Badge tone="brand">New</Badge>}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    {
      key: 'message',
      header: 'Message',
      // One-line preview; the full text opens on row click.
      render: (row) => (
        <span className="block max-w-xs truncate text-gray-600" title="Click to read the full message">
          {row.message}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Received', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        // stopPropagation: the row itself opens the message.
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <IconActionButton
            action="delete"
            label={`Delete message from ${row.name || 'visitor'}`}
            onClick={() => setDeleteTarget(row)}
          />
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    setDeleting(true);
    const result = await dispatch(deleteContact(deleteTarget._id));
    setDeleting(false);
    setDeleteTarget(null);
    if (deleteContact.fulfilled.match(result)) setViewing(null);
  };

  return (
    <div>
      <PageHeader title="Contact Messages" description="Enquiries submitted through the public contact form" />
      <Table
        columns={columns}
        rows={items}
        loading={status === 'loading' && items.length === 0}
        rowKey="_id"
        onRowClick={setViewing}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Contact message" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-semibold uppercase text-brand-700">
                  {(viewing.name || '?').charAt(0)}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{viewing.name || 'Visitor'}</p>
                  <p className="text-xs text-gray-500">Received {formatDateTime(viewing.createdAt)}</p>
                </div>
              </div>
              {isNewContact(viewing, seenBefore) && <Badge tone="brand">New</Badge>}
            </div>

            <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="mt-0.5 break-all font-medium text-gray-900">
                  {viewing.email ? (
                    <a href={`mailto:${viewing.email}`} className="hover:text-brand-600 hover:underline">
                      {viewing.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5" /> Mobile
                </dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {viewing.mobile ? (
                    <a href={`tel:${viewing.mobile}`} className="hover:text-brand-600 hover:underline">
                      {viewing.mobile}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>

            <div>
              {viewing.subject && <p className="mb-2 font-semibold text-gray-900">{viewing.subject}</p>}
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{viewing.message || '—'}</p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              <IconActionButton
                action="delete"
                label={`Delete message from ${viewing.name || 'visitor'}`}
                onClick={() => setDeleteTarget(viewing)}
              />
              {viewing.email && (
                <a
                  href={`mailto:${viewing.email}?subject=${encodeURIComponent('Re: your message to Pickmymaid')}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
                >
                  <Reply className="h-4 w-4" /> Reply by email
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete message"
        message={`Permanently delete the message from ${deleteTarget?.name || 'this visitor'}${
          deleteTarget?.email ? ` (${deleteTarget.email})` : ''
        }? This can't be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

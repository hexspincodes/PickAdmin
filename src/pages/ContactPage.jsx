import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContacts,
  isNewContact,
  readContactsLastSeen,
  setContactsLastSeen,
  writeContactsLastSeen,
} from '../features/contact/contactSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { formatDateTime } from '../utils/formatDate';

export default function ContactPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.contact);
  const userId = useSelector((state) => state.auth.user?.user_id);
  // Captured on arrival so the rows that were new stay marked while the admin reads them.
  const [seenBefore] = useState(() => readContactsLastSeen(userId));

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
    { key: 'message', header: 'Message', render: (row) => <span className="line-clamp-2 max-w-md">{row.message}</span> },
    { key: 'createdAt', header: 'Received', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Contact Messages" description="Enquiries submitted through the public contact form" />
      <Table columns={columns} rows={items} loading={status === 'loading' && items.length === 0} rowKey="_id" />
    </div>
  );
}

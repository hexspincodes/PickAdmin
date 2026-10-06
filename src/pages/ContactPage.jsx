import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts } from '../features/contact/contactSlice';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import { formatDateTime } from '../utils/formatDate';

export default function ContactPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.contact);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'mobile', header: 'Mobile' },
    { key: 'message', header: 'Message', render: (row) => <span className="line-clamp-2 max-w-md">{row.message}</span> },
    { key: 'createdAt', header: 'Received', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="Contact Messages" description="Enquiries submitted through the public contact form" />
      <Table columns={columns} rows={items} loading={status === 'loading'} rowKey="_id" />
    </div>
  );
}

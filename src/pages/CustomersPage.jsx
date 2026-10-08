import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { KeyRound, Ban, ShieldCheck, BadgeCheck } from 'lucide-react';
import { fetchCustomers, resetCustomerPassword, toggleCustomerBlock, verifyCustomerPayment } from '../features/customers/customersSlice';
import { CUSTOMERS_PAGE_SIZE } from '../features/customers/customersAPI';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import { Field, TextInput } from '../components/common/FormField';

export default function CustomersPage() {
  const dispatch = useDispatch();
  const { items, count, status, error, page, search } = useSelector((state) => state.customers);
  const totalPages = Math.max(1, Math.ceil(count / CUSTOMERS_PAGE_SIZE));
  const [searchInput, setSearchInput] = useState(search);
  const [resetTarget, setResetTarget] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [transRef, setTransRef] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, search: '' }));
  }, [dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) dispatch(fetchCustomers({ page: 1, search: searchInput }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleResetPassword = async () => {
    const result = await dispatch(resetCustomerPassword({ user_id: resetTarget.user_id, password: '' }));
    if (resetCustomerPassword.fulfilled.match(result)) {
      setGeneratedPassword(result.payload);
    }
  };

  const handleVerify = async () => {
    await dispatch(verifyCustomerPayment({ user_id: verifyTarget.user_id, transRef }));
    setVerifyTarget(null);
    setTransRef('');
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row) => `${row.first_name} ${row.last_name || ''}`.trim() },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'user_id', header: 'User ID' },
    {
      key: 'is_blocked',
      header: 'Status',
      render: (row) => (row.is_blocked ? <Badge tone="red">Blocked</Badge> : <Badge tone="green">Active</Badge>),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" title="Reset password" onClick={() => setResetTarget(row)}>
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          <Button variant="secondary" size="sm" title="Verify payment" onClick={() => setVerifyTarget(row)}>
            <BadgeCheck className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={row.is_blocked ? 'secondary' : 'danger'}
            size="sm"
            title={row.is_blocked ? 'Unblock' : 'Block'}
            onClick={() => dispatch(toggleCustomerBlock(row.user_id))}
          >
            {row.is_blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer accounts, passwords, and payment status"
        actions={<SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search by name or email" className="w-72" />}
      />

      {status === 'failed' && <p className="mb-3 text-sm text-red-500">Couldn't load customers: {error}</p>}
      <Table columns={columns} rows={items} loading={status === 'loading'} rowKey="user_id" />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Page {page} of {totalPages} · {count} customers
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || status === 'loading'}
            onClick={() => dispatch(fetchCustomers({ page: page - 1, search }))}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || status === 'loading'}
            onClick={() => dispatch(fetchCustomers({ page: page + 1, search }))}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal
        open={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setGeneratedPassword('');
        }}
        title="Reset Customer Password"
        size="sm"
      >
        {generatedPassword ? (
          <div>
            <p className="text-sm text-gray-600">New password for {resetTarget?.email}:</p>
            <p className="mt-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900">{generatedPassword}</p>
            <p className="mt-2 text-xs text-gray-400">Share this securely — it will not be shown again.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              Generate and set a new random password for <strong>{resetTarget?.email}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setResetTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword}>Generate & Set</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!verifyTarget} onClose={() => setVerifyTarget(null)} title="Verify Customer Payment" size="sm">
        <Field label="Payment transaction reference" required>
          <TextInput value={transRef} onChange={(e) => setTransRef(e.target.value)} placeholder="REF-12345" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setVerifyTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={!transRef}>
            Verify Payment
          </Button>
        </div>
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Ban, UsersRound, UserCheck, X } from 'lucide-react';
import {
  fetchCustomers,
  fetchAllCustomers,
  resetCustomerPassword,
  toggleCustomerBlock,
} from '../features/customers/customersSlice';
import StatCards from '../components/common/StatCards';
import { formatDateTime } from '../utils/formatDate';
import { CUSTOMERS_PAGE_SIZE } from '../features/customers/customersAPI';
import PageHeader from '../components/common/PageHeader';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import IconActionButton from '../components/common/IconActionButton';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import CustomerPaymentsModal from '../components/payments/CustomerPaymentsModal';

// filter: '' shows the normal paginated list; 'active'/'blocked' filter every customer.
const STAT_CARDS = [
  { key: 'total', label: 'Total customers', filter: '', icon: UsersRound },
  { key: 'active', label: 'Active', filter: 'active', icon: UserCheck },
  { key: 'blocked', label: 'Blocked', filter: 'blocked', icon: Ban },
];

// A field from the customer's preference form (all optional strings).
const preferenceCell = (key) => (row) =>
  row.preference?.[key] ? <span className="capitalize">{row.preference[key]}</span> : <span className="text-gray-300">—</span>;

export default function CustomersPage() {
  const dispatch = useDispatch();
  const { items, count, status, error, page, search, all, allStatus } = useSelector((state) => state.customers);
  const [statusFilter, setStatusFilter] = useState('');
  const totalPages = Math.max(1, Math.ceil(count / CUSTOMERS_PAGE_SIZE));
  const [searchInput, setSearchInput] = useState(search);
  const [resetTarget, setResetTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, search: '' }));
    dispatch(fetchAllCustomers());
  }, [dispatch]);

  const counts = useMemo(() => {
    if (allStatus === 'idle' || (allStatus === 'loading' && all.length === 0)) return null;
    const blocked = all.filter((c) => c.is_blocked).length;
    return { total: all.length, active: all.length - blocked, blocked };
  }, [all, allStatus]);

  // With Active/Blocked selected, list every matching customer (searched client-side) instead of the server page.
  const statusRows = useMemo(() => {
    if (!statusFilter) return null;
    const term = search.trim().toLowerCase();
    return all.filter(
      (c) =>
        (statusFilter === 'blocked') === !!c.is_blocked &&
        (!term ||
          [c.first_name, c.last_name, c.email, c.phone, c.preference?.emirate_of_residence].some(
            (v) => v != null && String(v).toLowerCase().includes(term),
          )),
    );
  }, [statusFilter, all, search]);

  const resultCount = statusRows ? statusRows.length : count;

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


  // Row numbers continue across server pages (page 2 starts at 101); the Active/Blocked lists start at 1.
  const numberOffset = statusRows ? 0 : (page - 1) * CUSTOMERS_PAGE_SIZE;
  const tableRows = (statusRows ?? items).map((row, i) => ({ ...row, rowNumber: numberOffset + i + 1 }));

  const columns = [
    { key: 'rowNumber', header: '#', render: (row) => <span className="text-gray-400">{row.rowNumber}</span> },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div className="py-0.5">
          <p className="font-medium capitalize leading-snug text-gray-900">{`${row.first_name || ''} ${row.last_name || ''}`.trim() || '—'}</p>
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              className="mt-1 block text-sm leading-relaxed text-gray-500 hover:text-brand-600 hover:underline"
            >
              {row.email}
            </a>
          )}
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDateTime(row.createdAt) },
    { key: 'emirate_of_residence', header: 'Emirate', render: preferenceCell('emirate_of_residence') },
    {
      key: 'user_id',
      header: 'User ID',
      render: (row) => <span className="font-mono text-xs text-gray-600">{row.user_id}</span>,
    },
    { key: 'position_required', header: 'Position required', render: preferenceCell('position_required') },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <IconActionButton action="reset" label={`Reset password for ${row.email}`} onClick={() => setResetTarget(row)} />
          <IconActionButton
            action={row.is_blocked ? 'unblock' : 'block'}
            label={`${row.is_blocked ? 'Unblock' : 'Block'} ${row.email}`}
            onClick={() => dispatch(toggleCustomerBlock(row.user_id))}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer accounts, passwords, and payment status"
      />

      <StatCards
        cards={STAT_CARDS}
        counts={counts}
        activeFilter={statusFilter}
        onSelect={setStatusFilter}
        className="xl:grid-cols-3"
      />

      <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search name, email, phone or emirate"
          className="sm:w-96"
          inputClassName="rounded-full border-gray-200 bg-gray-50 focus:bg-white"
        />
        <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
            <span className="text-sm font-bold text-brand-600">{resultCount}</span>
            result{resultCount === 1 ? '' : 's'}
          </span>
          {(searchInput || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setStatusFilter('');
              }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {status === 'failed' && <p className="mb-3 text-sm text-red-500">Couldn't load customers: {error}</p>}
      <Table
        columns={columns}
        rows={tableRows}
        onRowClick={setHistoryTarget}
        loading={statusRows ? allStatus === 'loading' && all.length === 0 : status === 'loading'}
        rowKey="user_id"
        emptyMessage={statusRows ? `No ${statusFilter} customers` : undefined}
      />
      {statusRows ? (
        <p className="mt-3 text-xs text-gray-400">
          {statusRows.length} {statusFilter} customer{statusRows.length === 1 ? '' : 's'}
        </p>
      ) : (
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
      )}

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

      <CustomerPaymentsModal customer={historyTarget} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}

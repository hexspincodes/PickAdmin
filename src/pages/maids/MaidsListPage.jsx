import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Plus, Video, SlidersHorizontal, X } from 'lucide-react';
import { fetchMaids, fetchMaidStatusCounts, deleteMaid } from '../../features/maids/maidsSlice';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import IconActionButton from '../../components/common/IconActionButton';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MaidStatusCards from './MaidStatusCards';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'hired', label: 'Hired' },
  { value: 'unhired', label: 'Available' },
];

export default function MaidsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // The dashboard's maid cards link here with { filter } in the route state.
  const initialFilter = useLocation().state?.filter || '';
  const { items, count, status, page, limit, search, filter, statusCounts } = useSelector((state) => state.maids);
  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchMaids({ page: 1, limit: 100, search: '', filter: initialFilter }));
    dispatch(fetchMaidStatusCounts());
  }, [dispatch, initialFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) dispatch(fetchMaids({ page: 1, limit, search: searchInput, filter }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleFilterChange = (value) => {
    dispatch(fetchMaids({ page: 1, limit, search, filter: value }));
  };

  const clearFilters = () => {
    setSearchInput('');
    dispatch(fetchMaids({ page: 1, limit, search: '', filter: '' }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteMaid(deleteTarget._id));
    setDeleteTarget(null);
  };

  const columns = [
    { key: 'ref_number', header: 'Ref #' },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          {row.name}
          {row.video && (
            <span title="Has intro video — open Edit to watch">
              <Video className="h-3.5 w-3.5 text-brand-600" />
            </span>
          )}
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
    { key: 'uae_no', header: 'UAE No.', render: (row) => row.uae_no || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.status === 1 ? (
          <Badge tone="green">Approved</Badge>
        ) : row.status === 3 ? (
          <Badge tone="red">Disabled</Badge>
        ) : (
          <Badge tone="yellow">Pending</Badge>
        ),
    },
    {
      key: 'availability',
      header: 'Available',
      render: (row) => (row.availability ? <Badge tone="green">Yes</Badge> : <Badge tone="gray">No</Badge>),
    },
    {
      key: 'references',
      header: 'Referenced',
      render: (row) => (row.references ? <Badge tone="blue">Yes</Badge> : <Badge tone="gray">No</Badge>),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <IconActionButton action="edit" label={`Edit ${row.name}`} onClick={() => navigate(`/maids/${row._id}/edit`)} />
          <IconActionButton action="delete" label={`Delete ${row.name}`} onClick={() => setDeleteTarget(row)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Maids"
        description="Maid applications and profiles"
        actions={
          <Link
            to="/maids/new"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 py-1.5 pl-1.5 pr-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500">
              <Plus className="h-4 w-4" />
            </span>
            Create Maid
          </Link>
        }
      />

      <MaidStatusCards counts={statusCounts} activeFilter={filter} onSelect={handleFilterChange} />

      <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search name, email, ref, mobile"
          className="lg:w-80"
          inputClassName="rounded-full border-gray-200 bg-gray-50 focus:bg-white"
        />
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          <SlidersHorizontal className="mr-1 h-4 w-4 shrink-0 text-gray-400" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={clsx(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.value ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
            <span className="text-sm font-bold text-brand-600">{count}</span>
            result{count === 1 ? '' : 's'}
          </span>
          {(filter || search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        rows={items}
        loading={status === 'loading'}
        rowKey="_id"
        onRowClick={(row) => navigate(`/maids/${row._id}`)}
      />
      <Pagination page={page} totalPages={Math.ceil(count / limit) || 1} onChange={(p) => dispatch(fetchMaids({ page: p, limit, search, filter }))} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete maid application"
        message={`Permanently delete ${deleteTarget?.name}'s profile? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

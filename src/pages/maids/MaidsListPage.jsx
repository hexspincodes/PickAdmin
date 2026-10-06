import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, CheckCircle2, EyeOff, Eye, History, Video } from 'lucide-react';
import { fetchMaids, deleteMaid, setMaidVerified, setMaidDisabled } from '../../features/maids/maidsSlice';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Select } from '../../components/common/FormField';
import MaidHistoryModal from './MaidHistoryModal';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'unapproved', label: 'Unapproved' },
  { value: 'hired', label: 'Hired' },
  { value: 'unhired', label: 'Available' },
];

export default function MaidsListPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, count, status, page, limit, search, filter } = useSelector((state) => state.maids);
  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchMaids({ page: 1, limit: 100, search: '', filter: '' }));
  }, [dispatch]);

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
        <div className="flex justify-end gap-1.5">
          <Button variant="secondary" size="sm" title="History" onClick={() => setHistoryTarget(row)}>
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            title={row.status === 1 ? 'Un-verify' : 'Verify'}
            onClick={() => dispatch(setMaidVerified({ id: row._id, verified: row.status !== 1 }))}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            title={row.status === 3 ? 'Enable' : 'Disable'}
            onClick={() => dispatch(setMaidDisabled({ id: row._id, disabled: row.status !== 3 }))}
          >
            {row.status === 3 ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="secondary" size="sm" title="Edit" onClick={() => navigate(`/maids/${row._id}/edit`)}>
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
        title="Maids"
        description="Maid applications and profiles"
        actions={
          <>
            <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search name, email, ref, mobile" className="w-64" />
            <Select value={filter} onChange={(e) => handleFilterChange(e.target.value)} className="w-40">
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Button onClick={() => navigate('/maids/new')}>
              <Plus className="h-4 w-4" /> Add Maid
            </Button>
          </>
        }
      />

      <Table columns={columns} rows={items} loading={status === 'loading'} rowKey="_id" />
      <Pagination page={page} totalPages={Math.ceil(count / limit) || 1} onChange={(p) => dispatch(fetchMaids({ page: p, limit, search, filter }))} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete maid application"
        message={`Permanently delete ${deleteTarget?.name}'s profile? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <MaidHistoryModal maid={historyTarget} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}

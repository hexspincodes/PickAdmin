import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../components/common/Modal';
import { fetchMaidHistory, clearCurrentMaid } from '../../features/maids/maidsSlice';
import { formatDateTime } from '../../utils/formatDate';

// Bookkeeping fields the backend diff picks up but that aren't real edits
const IGNORED_KEYS = new Set(['_id', '__v', 'createdAt', 'updatedAt']);

const isLeaf = (value) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((k) => k === 'old' || k === 'new');

// Backend stores changes as { field: { old, new } }, nested for object fields (e.g. salary.from)
function flattenChanges(changes, prefix = []) {
  if (!changes || typeof changes !== 'object') return [];
  return Object.entries(changes).flatMap(([key, value]) => {
    if (IGNORED_KEYS.has(key)) return [];
    const path = [...prefix, key];
    if (isLeaf(value)) return [{ path, old: value.old, new: value.new }];
    if (value && typeof value === 'object' && !Array.isArray(value)) return flattenChanges(value, path);
    return [{ path, old: undefined, new: value }];
  });
}

const fieldLabel = (path) => path.map((p) => p.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')).join(' ').toLowerCase();

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value.map((v) => (v && typeof v === 'object' ? v.title || v.name || JSON.stringify(v) : String(v))).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
  return String(value);
}

function HistoryEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const changes = flattenChanges(entry.changes);
  const isCreation = entry.revision === 0;

  return (
    <li className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
      <div className="text-xs text-gray-400">{entry.createdAt ? formatDateTime(entry.createdAt) : ''}</div>

      <div className="mt-2">
        <p className="text-xs font-medium text-gray-500">{isCreation ? 'Profile created' : 'Changes:'}</p>
        {changes.length === 0 ? (
          <p className="mt-1 text-xs text-gray-400">No field changes recorded</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {changes.map((c) => (
              <span key={c.path.join('.')} className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                {fieldLabel(c.path)}
              </span>
            ))}
          </div>
        )}
      </div>

      {changes.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      )}

      {expanded && (
        <table className="mt-2 w-full table-fixed text-xs">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="w-1/4 pb-1 font-medium">Field</th>
              <th className="pb-1 font-medium">Old</th>
              <th className="pb-1 font-medium">New</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr key={c.path.join('.')} className="border-t border-gray-50 align-top">
                <td className="py-1 pr-2 capitalize text-gray-600">{fieldLabel(c.path)}</td>
                <td className="break-words py-1 pr-2 text-red-600">{formatValue(c.old)}</td>
                <td className="break-words py-1 text-green-700">{formatValue(c.new)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          Updated by{' '}
          <span className="font-medium text-gray-700">{entry.updated_by?.name || entry.updated_by?.email || entry.updated_by}</span>
        </span>
        <span>Revision: {entry.revision}</span>
      </div>
    </li>
  );
}

export default function MaidHistoryModal({ maid, onClose }) {
  const dispatch = useDispatch();
  const history = useSelector((state) => state.maids.history);

  useEffect(() => {
    if (maid?._id) dispatch(fetchMaidHistory(maid._id));
    return () => {
      if (maid) dispatch(clearCurrentMaid());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maid]);

  return (
    <Modal open={!!maid} onClose={onClose} title={`History — ${maid?.name || ''}`}>
      {history.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No history recorded</p>
      ) : (
        <ul className="space-y-3">
          {history.map((entry) => (
            <HistoryEntry key={entry._id} entry={entry} />
          ))}
        </ul>
      )}
    </Modal>
  );
}

import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

const ROWS = [
  { name: 'Verify new maid applications', status: 'In Progress', deadline: 'Today, 5:00 PM' },
  { name: 'Review flagged customer complaint', status: 'Pending', deadline: 'Tomorrow, 11:00 AM' },
  { name: 'Approve featured maid listings', status: 'Completed', deadline: '18 Sep 2026' },
  { name: 'Follow up on pending payments', status: 'In Progress', deadline: '20 Sep 2026' },
];

const STATUS_STYLES = {
  Completed: 'bg-emerald-50 text-emerald-600',
  'In Progress': 'bg-amber-50 text-amber-600',
  Pending: 'bg-gray-100 text-gray-500',
};

export default function AssignmentsCard() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">My Assignments</h3>
        <button className="text-gray-300 hover:text-gray-500">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-b border-gray-100 px-1 pb-3 text-[11px] font-medium text-gray-400">
        <span className="flex items-center gap-1.5">
          Assignments Name <ArrowUpDown className="h-3 w-3" />
        </span>
        <span className="flex items-center gap-1.5">
          Working Status <ArrowUpDown className="h-3 w-3" />
        </span>
        <span className="flex items-center gap-1.5">
          Time Deadline <ArrowUpDown className="h-3 w-3" />
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {ROWS.map((row) => (
          <div key={row.name} className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 px-1 py-3">
            <p className="truncate text-sm text-gray-700">{row.name}</p>
            <span
              className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[row.status]}`}
            >
              {row.status}
            </span>
            <p className="text-sm text-gray-500">{row.deadline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { MoreHorizontal } from 'lucide-react';

export default function TimelineProgressCard({ title, percent = 0, startDate, endDate, todayDate }) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-300 hover:text-gray-500">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mt-10">
        {todayDate && (
          <div
            className="absolute -top-8 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${clamped}%` }}
          >
            <span className="whitespace-nowrap rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
              Today <span className="text-gray-400">{todayDate}</span>
            </span>
            <span className="mt-0.5 h-2 w-px bg-gray-300" />
          </div>
        )}

        <div
          className="flex h-8 w-full overflow-hidden rounded-full bg-brand-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(242,113,29,0.14) 4px, rgba(242,113,29,0.14) 8px)',
          }}
        >
          <div
            className="flex h-full items-center justify-center rounded-full bg-brand-500 text-[11px] font-semibold text-white transition-all"
            style={{ width: `${Math.max(clamped, 6)}%` }}
          >
            {clamped >= 22 ? `${clamped}% Completed` : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div>
          <p className="text-[11px]">Start Date</p>
          <p className="font-medium text-gray-600">{startDate}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px]">End Date</p>
          <p className="font-medium text-gray-600">{endDate}</p>
        </div>
      </div>
    </div>
  );
}

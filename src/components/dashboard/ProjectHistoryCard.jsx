import { useState } from 'react';
import { Building2, MapPin, User } from 'lucide-react';

const ROWS = [
  { name: 'Amara Fernandez', role: 'Full-time Package', location: 'Dubai Marina', area: 'Dubai', service: 'Live-in Maid', status: 'completed' },
  { name: 'Rosalind Cortez', role: 'Weekly Cleaning', location: 'Al Barsha', area: 'Dubai', service: 'Part-time Maid', status: 'completed' },
  { name: 'Priya Sharma', role: 'Monthly Package', location: 'Jumeirah', area: 'Dubai', service: 'Cook', status: 'pending' },
  { name: 'Grace Owusu', role: 'Full-time Package', location: 'Mirdif', area: 'Dubai', service: 'Nanny', status: 'completed' },
  { name: 'Lourdes Villanueva', role: 'One-time Deep Clean', location: 'Downtown', area: 'Dubai', service: 'Elderly Care', status: 'pending' },
];

export default function ProjectHistoryCard() {
  const [tab, setTab] = useState('completed');
  const rows = ROWS.filter((row) => row.status === tab);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Booking History</h3>
        <div className="flex rounded-full bg-gray-50 p-1 text-xs font-medium">
          {['completed', 'pending'].map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1.5 capitalize transition-colors ${
                tab === key ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1.4fr_1fr_0.9fr] gap-2 px-1 pb-2 text-[11px] font-medium text-gray-400">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Client
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Location
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> Service
        </span>
      </div>

      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[1.4fr_1fr_0.9fr] items-center gap-2 rounded-xl px-1 py-2 hover:bg-gray-50">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                {row.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{row.name}</p>
                <p className="truncate text-[11px] text-gray-400">{row.role}</p>
              </div>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-600">{row.location}</p>
              <p className="truncate text-[11px] text-gray-400">{row.area}</p>
            </div>
            <p className="truncate text-sm text-gray-600">{row.service}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No bookings</p>}
      </div>
    </div>
  );
}

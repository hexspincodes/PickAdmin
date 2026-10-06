import { Loader2, InboxIcon } from 'lucide-react';

/**
 * columns: [{ key, header, render?(row) }]
 */
export default function Table({ columns, rows, loading, emptyMessage = 'No records found', rowKey = '_id' }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="border border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="border border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
                <InboxIcon className="mx-auto mb-2 h-6 w-6" />
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row[rowKey] ?? i} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap border border-gray-200 px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

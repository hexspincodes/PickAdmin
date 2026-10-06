export function Field({ label, children, hint, required }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50';

export function TextInput(props) {
  return <input {...props} className={inputClass} />;
}

export function TextArea(props) {
  return <textarea {...props} className={inputClass} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={inputClass}>
      {children}
    </select>
  );
}

export function FileInput(props) {
  return (
    <input
      type="file"
      {...props}
      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
    />
  );
}

export function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" {...props} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
      {label}
    </label>
  );
}

import clsx from 'clsx';

const tones = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  gray: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export default function Badge({ children, tone = 'gray', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

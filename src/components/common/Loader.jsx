import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Centered spinner with an optional label.
 * fullPage: fills the viewport (used before the layout renders).
 */
export default function Loader({ label = 'Loading…', fullPage = false, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'flex flex-col items-center justify-center gap-2 text-sm text-gray-400',
        fullPage ? 'h-screen' : 'py-10',
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      {label && <span>{label}</span>}
    </div>
  );
}

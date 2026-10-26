import clsx from 'clsx';
import { Ban, KeyRound, ShieldCheck, SquarePen, Trash2 } from 'lucide-react';

// Soft tinted tile at rest; fills with the solid colour on hover. Icon motion respects reduced-motion.
const TONES = {
  edit: {
    icon: SquarePen,
    label: 'Edit',
    tile: 'bg-brand-50 text-brand-600 ring-brand-200/70 hover:bg-brand-500 hover:text-white hover:ring-brand-500 hover:shadow-brand-500/30 focus-visible:outline-brand-500',
    motion: 'motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-110',
  },
  delete: {
    icon: Trash2,
    label: 'Delete',
    tile: 'bg-red-50 text-red-600 ring-red-200/70 hover:bg-red-500 hover:text-white hover:ring-red-500 hover:shadow-red-500/30 focus-visible:outline-red-500',
    motion: 'motion-safe:group-hover:animate-wiggle',
  },
  reset: {
    icon: KeyRound,
    label: 'Reset password',
    tile: 'bg-blue-50 text-blue-600 ring-blue-200/70 hover:bg-blue-500 hover:text-white hover:ring-blue-500 hover:shadow-blue-500/30 focus-visible:outline-blue-500',
    motion: 'motion-safe:group-hover:-rotate-45',
  },
  block: {
    icon: Ban,
    label: 'Block',
    tile: 'bg-red-50 text-red-600 ring-red-200/70 hover:bg-red-500 hover:text-white hover:ring-red-500 hover:shadow-red-500/30 focus-visible:outline-red-500',
    motion: 'motion-safe:group-hover:rotate-90',
  },
  unblock: {
    icon: ShieldCheck,
    label: 'Unblock',
    tile: 'bg-green-50 text-green-600 ring-green-200/70 hover:bg-green-500 hover:text-white hover:ring-green-500 hover:shadow-green-500/30 focus-visible:outline-green-500',
    motion: 'motion-safe:group-hover:scale-125',
  },
};

export default function IconActionButton({ action, label, onClick, className }) {
  const { icon: Icon, label: defaultLabel, tile, motion } = TONES[action];
  const text = label || defaultLabel;
  return (
    <button
      type="button"
      onClick={onClick}
      title={text}
      aria-label={text}
      className={clsx(
        'group inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1 ring-inset transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        tile,
        className,
      )}
    >
      <Icon className={clsx('h-4 w-4 transition-transform duration-200', motion)} strokeWidth={2} />
      {defaultLabel}
    </button>
  );
}

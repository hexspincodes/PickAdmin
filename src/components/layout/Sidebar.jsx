import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import clsx from 'clsx';
import { ChevronDown, Info, Settings, X } from 'lucide-react';
import { NAV_ITEMS } from '../../config/nav';
import { closeSidebar } from '../../features/ui/uiSlice';
import { ROLE_LABELS } from '../../utils/roles';

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={clsx('h-4.5 w-4.5 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const mainItems = items.filter((item) => item.group !== 'other');
  const otherItems = items.filter((item) => item.group === 'other');
  const initials = (user?.user_id || '?').slice(0, 2).toUpperCase();

  const content = (
    <div className="flex h-full flex-col bg-white text-gray-700">
      <div className="flex items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <img src="/Logo.png" alt="Pickmymaid" className="h-14 w-auto shrink-0" />
        </div>
        <button className="hidden text-gray-300 hover:text-gray-500 lg:block">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button className="text-gray-400 hover:text-gray-700 lg:hidden" onClick={() => dispatch(closeSidebar())}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        <div>
          <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300">Main Menu</p>
          <div className="space-y-1">
            {mainItems.map((item) => (
              <NavItem key={item.to} item={item} onClick={() => dispatch(closeSidebar())} />
            ))}
          </div>
        </div>

        {otherItems.length > 0 && (
          <div>
            <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300">Other</p>
            <div className="space-y-1">
              {otherItems.map((item) => (
                <NavItem key={item.to} item={item} onClick={() => dispatch(closeSidebar())} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="space-y-1 px-4 pb-3">
        <button className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800">
          <Info className="h-4.5 w-4.5 text-gray-400" />
          Information
        </button>
        <button className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800">
          <Settings className="h-4.5 w-4.5 text-gray-400" />
          Settings
        </button>
      </div>

      <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{user?.user_id}</p>
          <p className="truncate text-xs text-gray-400">{ROLE_LABELS[user?.role] || user?.role}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(closeSidebar())} />
          <aside className="absolute inset-y-0 left-0 w-64">{content}</aside>
        </div>
      )}
    </>
  );
}

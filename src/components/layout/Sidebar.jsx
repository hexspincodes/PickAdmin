import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import clsx from 'clsx';
import { ChevronDown, Info, Settings, X } from 'lucide-react';
import { NAV_ITEMS } from '../../config/nav';
import { closeSidebar } from '../../features/ui/uiSlice';
import { ROLE_LABELS } from '../../utils/roles';

// collapsed: icon-only rail — labels are hidden and moved to the native tooltip.
function NavItem({ item, onClick, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-2xl py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-0' : 'px-3.5',
          isActive ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={clsx('h-4.5 w-4.5 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function FooterButton({ icon: Icon, label, collapsed }) {
  return (
    <button
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800',
        collapsed ? 'justify-center' : 'px-3.5',
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0 text-gray-400" />
      {!collapsed && label}
    </button>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const mainItems = items.filter((item) => item.group !== 'other');
  const otherItems = items.filter((item) => item.group === 'other');
  const initials = (user?.user_id || '?').slice(0, 2).toUpperCase();

  const renderContent = (collapsed) => (
    <div className="flex h-full flex-col bg-white text-gray-700">
      <div className={clsx('flex items-center py-6', collapsed ? 'justify-center px-3' : 'justify-between px-5')}>
        <Link
          to="/"
          onClick={() => dispatch(closeSidebar())}
          title="Go to dashboard"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <img
            src="/Logo.png"
            alt="Pickmymaid — go to dashboard"
            className={clsx('w-auto shrink-0 object-contain', collapsed ? 'h-9 max-w-14' : 'h-14')}
          />
        </Link>
        {!collapsed && (
          <button className="hidden text-gray-300 hover:text-gray-500 lg:block">
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-700 lg:hidden" onClick={() => dispatch(closeSidebar())}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className={clsx('flex-1 space-y-6 overflow-y-auto pb-4', collapsed ? 'px-3' : 'px-4')}>
        <div>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-gray-200" />
          ) : (
            <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300">Main Menu</p>
          )}
          <div className="space-y-1">
            {mainItems.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} onClick={() => dispatch(closeSidebar())} />
            ))}
          </div>
        </div>

        {otherItems.length > 0 && (
          <div>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-gray-200" />
            ) : (
              <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-300">Other</p>
            )}
            <div className="space-y-1">
              {otherItems.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} onClick={() => dispatch(closeSidebar())} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className={clsx('space-y-1 pb-3', collapsed ? 'px-3' : 'px-4')}>
        <FooterButton icon={Info} label="Information" collapsed={collapsed} />
        <FooterButton icon={Settings} label="Settings" collapsed={collapsed} />
      </div>

      <div
        className={clsx(
          'mb-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60',
          collapsed ? 'mx-3 justify-center p-2' : 'mx-4 p-3',
        )}
        title={collapsed ? `${user?.user_id || ''} · ${ROLE_LABELS[user?.role] || user?.role || ''}` : undefined}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
          {initials}
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{user?.user_id}</p>
            <p className="truncate text-xs text-gray-400">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={clsx(
          'hidden shrink-0 overflow-hidden border-r border-gray-100 transition-[width] duration-200 motion-reduce:transition-none lg:block',
          sidebarCollapsed ? 'w-20' : 'w-64',
        )}
      >
        {renderContent(sidebarCollapsed)}
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(closeSidebar())} />
          {/* The mobile drawer is always full width. */}
          <aside className="absolute inset-y-0 left-0 w-64">{renderContent(false)}</aside>
        </div>
      )}
    </>
  );
}

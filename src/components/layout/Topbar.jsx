import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, Download, ListFilter, LogOut, Menu, MessageSquare, Plus, Search } from 'lucide-react';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { logout } from '../../features/auth/authSlice';
import { NAV_ITEMS } from '../../config/nav';

const AVATAR_COLORS = ['bg-brand-500', 'bg-gray-800', 'bg-brand-300'];

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const pageLabel =
    NAV_ITEMS.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.label ||
    'Dashboard';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 lg:gap-4 lg:px-6">
      <button className="text-gray-500 hover:text-gray-700 lg:hidden" onClick={() => dispatch(toggleSidebar())}>
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden shrink-0 lg:block">
        <p className="text-lg font-semibold leading-tight text-gray-900">{pageLabel}</p>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <div className="relative ml-1 hidden max-w-xs flex-1 lg:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full rounded-full border border-gray-200 bg-gray-50/70 py-2 pl-10 pr-4 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-1 focus:ring-brand-300"
        />
      </div>

      <button className="hidden rounded-full border border-gray-200 p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 lg:flex">
        <ListFilter className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden -space-x-2 sm:flex">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white',
                AVATAR_COLORS[i],
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
          <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-brand-300 hover:text-brand-500">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <MessageSquare className="h-4.5 w-4.5" />
        </button>
        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={handleLogout}
          title={`Log out ${user?.user_id || ''}`}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>

        <button className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
}

import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ListFilter, LogOut, Menu, MessageSquare, Plus, Search } from 'lucide-react';
import { toggleSidebar } from '../../features/ui/uiSlice';
import { logout } from '../../features/auth/authSlice';
import { NAV_ITEMS } from '../../config/nav';
import { ROLES } from '../../utils/roles';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const canCreateMaid = user?.role === ROLES.SA || user?.role === ROLES.A;

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
        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <MessageSquare className="h-4.5 w-4.5" />
        </button>
        <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={handleLogout}
          title={`Log out ${user?.user_id || ''}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 sm:px-3.5"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        {canCreateMaid && (
          <Link
            to="/maids/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 py-1.5 pl-1.5 pr-1.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:pr-4"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Plus className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Create Maid</span>
          </Link>
        )}
      </div>
    </header>
  );
}

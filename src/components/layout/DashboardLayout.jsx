import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50/60">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

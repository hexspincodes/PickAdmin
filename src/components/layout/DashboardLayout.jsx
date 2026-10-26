import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Loader from '../common/Loader';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          <Suspense fallback={<Loader label="Loading page…" className="py-24" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

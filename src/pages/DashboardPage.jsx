import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Filter, MoreHorizontal, Pencil, Plus, Share2, UserRound } from 'lucide-react';
import { fetchMaidCounts } from '../features/maids/maidsSlice';
import { fetchCategoryAnalytics } from '../features/analytics/analyticsSlice';
import { ROLES } from '../utils/roles';
import TimelineProgressCard from '../components/dashboard/TimelineProgressCard';
import ActiveStatCard from '../components/dashboard/ActiveStatCard';
import DonutStatCard from '../components/dashboard/DonutStatCard';
import AnalyticsHistoryCard from '../components/dashboard/AnalyticsHistoryCard';
import ProjectHistoryCard from '../components/dashboard/ProjectHistoryCard';
import AssignmentsCard from '../components/dashboard/AssignmentsCard';
import { formatDate } from '../utils/formatDate';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { counts } = useSelector((state) => state.maids);
  const analytics = useSelector((state) => state.analytics.items);

  useEffect(() => {
    dispatch(fetchMaidCounts());
    if (user?.role === ROLES.SA) dispatch(fetchCategoryAnalytics({}));
  }, [dispatch, user]);

  const total = counts?.total ?? 0;
  const verified = counts?.verified ?? 0;
  const featured = counts?.featured ?? 0;
  const verifiedPercent = total ? Math.round((verified / total) * 100) : 0;
  const featuredPercent = total ? Math.round((featured / total) * 100) : 0;

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today.getFullYear(), 11, 31);
  const canCreateMaid = user?.role === ROLES.SA || user?.role === ROLES.A;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <Pencil className="h-3.5 w-3.5 text-gray-300" />
          </div>
          <p className="mt-1 max-w-lg text-sm text-gray-400">
            Manage maid applications, assign roles and keep track of platform activity.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
              <Share2 className="h-3 w-3" /> Shared
            </span>
            <button className="text-gray-300 hover:text-gray-500">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <UserRound className="h-4 w-4 text-gray-400" /> Person
          </button>
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="h-4 w-4 text-gray-400" /> Category Filter
          </button>
          {canCreateMaid && (
            <Link
              to="/maids/new"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" /> New Application
            </Link>
          )}
          <button className="flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-600">
            <Plus className="h-4 w-4" /> Add Widget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TimelineProgressCard
          title="Verification Progress"
          percent={verifiedPercent}
          startDate={formatDate(start)}
          endDate={formatDate(end)}
          todayDate={formatDate(today)}
        />
        <ActiveStatCard
          title="New Applications"
          badge={`${total}`}
          value={total}
          caption="applications total"
          data={[4, 7, 5, 9, 6, 12, 8]}
        />
        <DonutStatCard
          title="Featured Maids"
          badge={`${featuredPercent}%`}
          value={featured}
          caption="of total applications"
          percent={featuredPercent}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AnalyticsHistoryCard data={analytics} />
        </div>
        <div className="lg:col-span-2">
          <ProjectHistoryCard />
        </div>
      </div>

      <AssignmentsCard />
    </div>
  );
}

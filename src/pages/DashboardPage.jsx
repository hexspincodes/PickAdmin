import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Clock, EyeOff, Pencil, Plus, Users } from 'lucide-react';
import { fetchAllPayments } from '../features/payments/paymentsSlice';
import { fetchMaidStatusCounts } from '../features/maids/maidsSlice';
import StatCards from '../components/common/StatCards';
import { amountAED } from '../features/payments/paymentUtils';
import { isPaidPayment } from '../components/payments/PaymentPeriodCards';
import RevenueCards from '../components/dashboard/RevenueCards';
import MonthlyRevenueChart from '../components/dashboard/MonthlyRevenueChart';
import OverviewCards from '../components/dashboard/OverviewCards';
import { ROLES } from '../utils/roles';

// filter: the Maids Management list filter the card opens with.
const MAID_CARDS = [
  { key: 'total', label: 'Total maids', filter: '', icon: Users },
  { key: 'pending', label: 'Pending maids', filter: 'pending', icon: Clock },
  { key: 'disabled', label: 'Disabled maids', filter: 'disabled', icon: EyeOff },
  { key: 'hired', label: 'Hired maids', filter: 'hired', icon: Briefcase },
];

const SectionTitle = ({ children }) => (
  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</h2>
);

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { all, allStatus } = useSelector((state) => state.payments);
  const statusCounts = useSelector((state) => state.maids.statusCounts);
  // The payments API is Super Admin only; Maids Management is Super Admin and Admin.
  const canSeeRevenue = user?.role === ROLES.SA;
  const canCreateMaid = user?.role === ROLES.SA || user?.role === ROLES.A;
  const canSeeMaids = canCreateMaid;

  useEffect(() => {
    if (canSeeRevenue) dispatch(fetchAllPayments());
    if (canSeeMaids) dispatch(fetchMaidStatusCounts());
  }, [dispatch, canSeeRevenue, canSeeMaids]);

  const paid = useMemo(() => all.filter(isPaidPayment), [all]);
  const revenueLoading = allStatus !== 'succeeded' && all.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <Pencil className="h-3.5 w-3.5 text-gray-300" />
          </div>
        </div>

        {canCreateMaid && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/maids/new"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" /> Create New Maid
            </Link>
          </div>
        )}
      </div>

      {canSeeMaids && (
        <section>
          <SectionTitle>Maids</SectionTitle>
          <StatCards
            cards={MAID_CARDS}
            counts={statusCounts}
            activeFilter={null}
            onSelect={(filter) => navigate('/maids', { state: { filter } })}
            className="md:grid-cols-4"
          />
        </section>
      )}

      {canSeeRevenue && (
        <section>
          <SectionTitle>Revenue</SectionTitle>
          {allStatus === 'failed' ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">Couldn&apos;t load revenue. Refresh to try again.</p>
          ) : (
            <div className="space-y-4">
              <RevenueCards paid={paid} amountOf={amountAED} loading={revenueLoading} />
              <MonthlyRevenueChart paid={paid} amountOf={amountAED} loading={revenueLoading} />
            </div>
          )}
        </section>
      )}

      {[ROLES.SA, ROLES.A, ROLES.MARKETING].includes(user?.role) && (
        <section>
          <SectionTitle>Overview</SectionTitle>
          <OverviewCards role={user.role} />
        </section>
      )}
    </div>
  );
}

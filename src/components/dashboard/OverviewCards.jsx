import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Mail, Newspaper, UsersRound } from 'lucide-react';
import StatCards from '../common/StatCards';
import { fetchAdminBlogs } from '../../features/blog/blogSlice';
import { fetchContacts } from '../../features/contact/contactSlice';
import { fetchCustomersTotal } from '../../features/customers/customersSlice';
import { ROLES } from '../../utils/roles';

// filter: the page the card opens. roles: who can load (and open) it.
const CARDS = [
  { key: 'blogs', label: 'Blog posts', filter: '/blog', icon: Newspaper, roles: [ROLES.SA, ROLES.MARKETING] },
  { key: 'contacts', label: 'Contact messages', filter: '/contact', icon: Mail, roles: [ROLES.SA, ROLES.A] },
  { key: 'customers', label: 'Customers', filter: '/customers', icon: UsersRound, roles: [ROLES.SA] },
];

/** Blog, contact-message and customer totals; each card opens its page. Renders nothing for roles with no cards. */
export default function OverviewCards({ role }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cards = CARDS.filter((c) => c.roles.includes(role));
  const show = (key) => cards.some((c) => c.key === key);

  const blog = useSelector((state) => state.blog);
  const contact = useSelector((state) => state.contact);
  const { total: customersTotal, totalStatus: customersTotalStatus } = useSelector((state) => state.customers);

  useEffect(() => {
    if (show('blogs')) dispatch(fetchAdminBlogs());
    // The top bar already loads contacts (bell) and the customer total; fetch only if it hasn't yet.
    if (show('contacts') && contact.status === 'idle') dispatch(fetchContacts());
    if (show('customers') && customersTotalStatus === 'idle') dispatch(fetchCustomersTotal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, role]);

  if (cards.length === 0) return null;

  const countOf = (slice) =>
    slice.status === 'failed' ? '—' : slice.status === 'succeeded' || slice.items.length > 0 ? slice.items.length : null;

  return (
    <StatCards
      cards={cards}
      counts={{
        blogs: countOf(blog),
        contacts: countOf(contact),
        customers: customersTotal ?? (customersTotalStatus === 'failed' ? '—' : null),
      }}
      activeFilter={null}
      onSelect={(to) => navigate(to)}
      className="md:grid-cols-3"
    />
  );
}

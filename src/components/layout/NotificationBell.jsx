import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, Mail } from 'lucide-react';
import {
  fetchContacts,
  isNewContact,
  readContactsLastSeen,
  setContactsLastSeen,
} from '../../features/contact/contactSlice';
import { formatDateTime } from '../../utils/formatDate';

const POLL_MS = 2 * 60 * 1000;
const SESSION_ALERT_KEY = 'pmm.contactAlertShown';

function alertToast(navigate, text) {
  toast(
    (t) => (
      <span className="flex items-center gap-3 text-sm">
        <span>{text}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            navigate('/contact');
          }}
          className="shrink-0 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600"
        >
          View
        </button>
      </span>
    ),
    { icon: <Mail className="h-5 w-5 text-brand-600" />, duration: 8000 },
  );
}

/** Top-bar bell for new contact messages: badge, drop-down list, and alerts on open / on arrival. */
export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onContactPage = useLocation().pathname.startsWith('/contact');
  const { user } = useSelector((state) => state.auth);
  const { items, status, lastSeen } = useSelector((state) => state.contact);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  // Ids already announced, so a poll only alerts about messages that just arrived.
  const announced = useRef(null);

  useEffect(() => {
    if (user?.user_id && lastSeen === null) dispatch(setContactsLastSeen(readContactsLastSeen(user.user_id)));
  }, [dispatch, user, lastSeen]);

  useEffect(() => {
    dispatch(fetchContacts());
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') dispatch(fetchContacts());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [dispatch]);

  const fresh = useMemo(
    () =>
      lastSeen === null
        ? []
        : items.filter((c) => isNewContact(c, lastSeen)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [items, lastSeen],
  );

  useEffect(() => {
    if (status !== 'succeeded' || lastSeen === null) return;
    if (announced.current === null) {
      // First load: one alert per browser session when the panel opens with unread messages.
      announced.current = new Set(items.map((c) => c._id));
      let shown = false;
      try {
        shown = sessionStorage.getItem(SESSION_ALERT_KEY) === '1';
        sessionStorage.setItem(SESSION_ALERT_KEY, '1');
      } catch {
        // storage unavailable — alert anyway
      }
      if (!shown && !onContactPage && fresh.length > 0) {
        alertToast(navigate, `You have ${fresh.length} new contact message${fresh.length === 1 ? '' : 's'}`);
      }
      return;
    }
    const arrived = fresh.filter((c) => !announced.current.has(c._id));
    items.forEach((c) => announced.current.add(c._id));
    if (arrived.length > 0 && !onContactPage) {
      alertToast(
        navigate,
        arrived.length === 1
          ? `New contact message from ${arrived[0].name || 'a visitor'}`
          : `${arrived.length} new contact messages`,
      );
    }
    // Only react to fresh data, not to navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status, lastSeen]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => panelRef.current && !panelRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const count = fresh.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={count ? `${count} new contact message${count === 1 ? '' : 's'}` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {count > 0 && <span className="rounded-full bg-red-50 px-2 text-xs font-medium leading-5 text-red-600">{count} new</span>}
          </div>
          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">No new contact messages</p>
          ) : (
            <ul className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
              {fresh.slice(0, 6).map((c) => (
                <li key={c._id}>
                  <Link
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-brand-50"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">{c.name || 'Visitor'}</span>
                      <span className="line-clamp-2 text-xs text-gray-500">{c.message}</span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">{formatDateTime(c.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-gray-50"
          >
            View all contact messages
          </Link>
        </div>
      )}
    </div>
  );
}

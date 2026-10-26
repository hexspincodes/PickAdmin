import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
} from 'lucide-react';
import {
  fetchMaidDashboard,
  clearCurrentMaid,
  deleteMaid,
  setMaidVerified,
  setMaidDisabled,
  setMaidAssured,
  setMaidAvailability,
} from '../../features/maids/maidsSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MaidHistoryModal from './MaidHistoryModal';
import { EDUCATION, LANGUAGE_LEVELS } from '../../constants/maidFormOptions';
import { mediaUrl } from '../../utils/mediaUrl';
import { downloadFile, downloadName } from '../../utils/downloadFile';
import { formatDate } from '../../utils/formatDate';
import { ROLES } from '../../utils/roles';

const list = (value) => (Array.isArray(value) ? value.filter(Boolean).join(', ') : value) || '—';

const levelLabel = (v) => LANGUAGE_LEVELS.find((l) => l.value === Number(v))?.label ?? '—';

function salaryLabel(maid) {
  if (maid.is_negotiable_salary) return 'Negotiable';
  const { from, to } = maid.salary || {};
  if (!from && !to) return '—';
  return `AED ${from ?? 0} – ${to ?? 0}`;
}

// Notes and job descriptions come from a rich-text editor and can be submitted through the
// public form, so render text only: one entry per line/block, leading bullet characters stripped.
function htmlToLines(html) {
  if (!html) return [];
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  body.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  body.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6').forEach((el) => {
    el.before('\n');
    el.append('\n');
  });
  return (body.textContent || '')
    .split('\n')
    .map((line) => line.replace(/^[\s•·\-*]+/, '').trim())
    .filter(Boolean);
}

function BulletList({ lines, className = '' }) {
  return (
    <ul className={`space-y-1 ${className}`}>
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-base text-gray-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'];

// The link can come from the public form: only http(s) URLs are shown, and only YouTube ones embedded.
function parseYoutube(link) {
  const raw = link.trim();
  let url;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  let id = null;
  if (YOUTUBE_HOSTS.includes(url.hostname)) {
    id = url.hostname.endsWith('youtu.be')
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  }
  return { url: url.href, id: /^[\w-]{11}$/.test(id || '') ? id : null };
}

function Section({ title, action, children }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// overlay: solid orange so it stays visible on top of photos with light backgrounds.
function DownloadButton({ loading, onClick, overlay = false, className = '', children }) {
  const look = overlay
    ? 'bg-brand-500 text-white shadow-lg shadow-black/20 hover:bg-brand-600'
    : 'bg-white text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-brand-500 hover:text-white hover:ring-brand-500';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-70 ${look} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-base font-medium capitalize text-gray-800">{children || '—'}</dd>
    </div>
  );
}

function ContactRow({ icon: Icon, label, children }) {
  if (!children) return null;
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-brand-50">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-gray-400">{label}</span>
        <span className="block truncate text-base font-medium text-gray-800">{children}</span>
      </span>
    </li>
  );
}

export default function MaidDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: maid, currentStatus } = useSelector((state) => state.maids);
  const { user } = useSelector((state) => state.auth);
  const isSA = user?.role === ROLES.SA;
  const [busy, setBusy] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchMaidDashboard(id));
    return () => dispatch(clearCurrentMaid());
  }, [dispatch, id]);

  // Status actions only refetch the list, so reload this profile afterwards.
  const runAction = async (key, thunk) => {
    setBusy(key);
    await dispatch(thunk);
    await dispatch(fetchMaidDashboard(id));
    setBusy(null);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(maid._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy the ID');
    }
  };

  const handleDownload = async (kind, key, fallbackExt) => {
    setDownloading(kind);
    await downloadFile(mediaUrl(key), downloadName(`${maid.name} ${kind}`, key, fallbackExt));
    setDownloading(null);
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteMaid(id));
    setConfirmDelete(false);
    if (deleteMaid.fulfilled.match(result)) navigate('/maids');
  };

  if (!maid) {
    return currentStatus === 'failed' ? (
      <div className="py-24 text-center">
        <p className="text-base text-gray-500">Couldn't load this maid profile.</p>
        <Link to="/maids" className="mt-3 inline-block text-base font-medium text-brand-600 hover:underline">
          Back to maids
        </Link>
      </div>
    ) : (
      <Loader label="Loading maid profile…" className="py-24" />
    );
  }

  const approved = maid.status === 1;
  const disabled = maid.status === 3;
  const hired = !maid.availability;
  const notes = htmlToLines(maid.notes);
  const languages = (maid.language || []).filter((l) => l.name);
  const jobs = maid.employmentHistory || [];
  const youtube = maid.youtube_link ? parseYoutube(maid.youtube_link) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/maids"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
            aria-label="Back to maids"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{maid.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-0.5 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200">
                Ref <span className="text-base font-bold text-brand-600">#{maid.ref_number}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                ID <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-700">{maid._id}</code>
                <button
                  type="button"
                  onClick={copyId}
                  title="Copy ID"
                  className="rounded-md p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/maids/${id}/edit`)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {isSA && (
            <Button
              variant="secondary"
              loading={busy === 'verify'}
              onClick={() => runAction('verify', setMaidVerified({ id, verified: !approved }))}
            >
              {busy !== 'verify' && <CheckCircle2 className="h-4 w-4" />} {approved ? 'Un-approve' : 'Approve'}
            </Button>
          )}
          <Button
            variant="secondary"
            loading={busy === 'disable'}
            onClick={() => runAction('disable', setMaidDisabled({ id, disabled: !disabled }))}
          >
            {busy !== 'disable' && (disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />)}
            {disabled ? 'Enable' : 'Disable'}
          </Button>
          <Button
            variant="secondary"
            loading={busy === 'hire'}
            onClick={() => runAction('hire', setMaidAvailability({ id, available: hired }))}
          >
            {busy !== 'hire' && (hired ? <UserCheck className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />)}
            {hired ? 'Mark Available' : 'Mark Hired'}
          </Button>
          <Button
            variant="secondary"
            loading={busy === 'assured'}
            onClick={() => runAction('assured', setMaidAssured({ id, assured: !maid.is_assured }))}
          >
            {busy !== 'assured' && <ShieldCheck className="h-4 w-4" />}
            {maid.is_assured ? 'Remove Assured' : 'Mark Assured'}
          </Button>
          {isSA && (
            <Button variant="secondary" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4" /> History
            </Button>
          )}
          {isSA && (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="relative mx-auto mt-5 aspect-[3/4] w-72 max-w-[calc(100%-2.5rem)] overflow-hidden bg-brand-50 ring-1 ring-gray-100">
              {maid.profile ? (
                <>
                  <a href={mediaUrl(maid.profile)} target="_blank" rel="noreferrer" title="Open full size" className="block h-full w-full">
                    <img src={mediaUrl(maid.profile)} alt={maid.name} className="h-full w-full object-cover object-top" />
                  </a>
                  <DownloadButton
                    overlay
                    loading={downloading === 'photo'}
                    onClick={() => handleDownload('photo', maid.profile, 'jpg')}
                    className="absolute right-3 top-3 z-10"
                  >
                    Photo
                  </DownloadButton>
                </>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-300">
                  <UserRound className="h-20 w-20" />
                  <span className="text-sm font-medium text-brand-400">No photo uploaded</span>
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">{maid.name}</p>
                <p className="text-base capitalize text-gray-500">{list(maid.service)}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {approved ? <Badge tone="green">Approved</Badge> : disabled ? <Badge tone="red">Disabled</Badge> : <Badge tone="yellow">Pending</Badge>}
                  {hired ? <Badge tone="brand">Hired</Badge> : <Badge tone="blue">Available</Badge>}
                  {maid.is_assured && <Badge tone="green">Assured</Badge>}
                  {maid.references && <Badge tone="blue">Referenced</Badge>}
                </div>
              </div>

              <ul className="mt-5 space-y-2 border-t border-gray-100 pt-4">
                <ContactRow icon={Phone} label="Mobile">{maid.uae_no || maid.mobile}</ContactRow>
                <ContactRow icon={MessageCircle} label="WhatsApp">{maid.whatsapp_no}</ContactRow>
                <ContactRow icon={MessageCircle} label="Botim">{maid.botim_number}</ContactRow>
                <ContactRow icon={Mail} label="Email">{maid.email}</ContactRow>
                <ContactRow icon={MapPin} label="Current location">{maid.current_location}</ContactRow>
              </ul>
            </div>
          </section>

          {maid.video && (
            <Section
              title="Intro video"
              action={
                <DownloadButton loading={downloading === 'video'} onClick={() => handleDownload('video', maid.video, 'mp4')}>
                  Video
                </DownloadButton>
              }
            >
              <video key={maid.video} src={mediaUrl(maid.video)} controls preload="metadata" className="max-h-96 w-full rounded-xl bg-black" />
            </Section>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Section title="Personal details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Age">{maid.age}</Field>
              <Field label="Nationality">{maid.nationality}</Field>
              <Field label="Current location">{maid.current_location}</Field>
              <Field label="Religion">{maid.religion}</Field>
              <Field label="Marital status">{maid.marital_status}</Field>
              <Field label="Education">{EDUCATION.find((e) => e.value === maid.education)?.label || maid.education}</Field>
              <Field label="Registered">{formatDate(maid.date)}</Field>
            </dl>
          </Section>

          <Section title="Job preferences">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Services">{list(maid.service)}</Field>
              <Field label="Locations">{list(maid.location)}</Field>
              <Field label="Live in / out">{list(maid.option)}</Field>
              <Field label="Salary">{salaryLabel(maid)}</Field>
              <Field label="Day off">{maid.day_of}</Field>
              <Field label="Available from">{maid.available_from}</Field>
              <Field label="Visa status">{maid.visa_status}</Field>
              <Field label="Visa expiry">{maid.visa_expire && formatDate(maid.visa_expire)}</Field>
            </dl>
          </Section>

          {maid.skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {maid.skills.map((s) => (
                  <span key={s} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium capitalize text-brand-700">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {languages.length > 0 && (
            <Section title="Languages">
              <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                  <thead>
                    <tr className="text-left text-sm text-gray-400">
                      <th className="pb-2 font-medium">Language</th>
                      <th className="pb-2 font-medium">Read</th>
                      <th className="pb-2 font-medium">Write</th>
                      <th className="pb-2 font-medium">Speak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 capitalize text-gray-700">
                    {languages.map((l) => (
                      <tr key={l.name}>
                        <td className="py-2 font-medium text-gray-900">{l.name}</td>
                        <td className="py-2">{levelLabel(l.read)}</td>
                        <td className="py-2">{levelLabel(l.write)}</td>
                        <td className="py-2">{levelLabel(l.speak)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {jobs.length > 0 && (
            <Section title="Employment history">
              <ol className="space-y-4">
                {jobs.map((j, i) => {
                  const duties = htmlToLines(j.job_description);
                  const reason = htmlToLines(j.reason_leaving).join(' ');
                  return (
                    <li key={i} className="border-l-2 border-brand-200 pl-4">
                      <p className="text-base font-semibold text-gray-900">{j.title || 'Untitled role'}</p>
                      <p className="text-sm text-gray-500">
                        {[j.location, j.experiance !== undefined && j.experiance !== '' && `${j.experiance} yr`].filter(Boolean).join(' · ')}
                      </p>
                      {duties.length > 0 && <BulletList lines={duties} className="mt-2" />}
                      {reason && (
                        <p className="mt-2 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">Reason for leaving:</span> {reason}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Section>
          )}

          {notes.length > 0 && (
            <Section title="Notes">
              <BulletList lines={notes} />
            </Section>
          )}

          {youtube && (
            <Section
              title="YouTube video"
              action={
                <a
                  href={youtube.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-red-600 hover:text-white hover:ring-red-600"
                >
                  <ExternalLink className="h-4 w-4" /> Open on YouTube
                </a>
              }
            >
              {youtube.id ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtube.id}`}
                    title={`${maid.name} — YouTube video`}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full"
                  />
                </div>
              ) : null}
              <p className={`${youtube.id ? 'mt-3' : ''} truncate text-sm text-gray-500`} title={youtube.url}>
                {youtube.url}
              </p>
            </Section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete maid application"
        message={`Permanently delete ${maid.name}'s profile? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <MaidHistoryModal maid={showHistory ? maid : null} onClose={() => setShowHistory(false)} />
    </div>
  );
}

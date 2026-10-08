import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ImagePlus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchMaidDashboard,
  createMaid,
  updateMaid,
  clearCurrentMaid,
  setMaidVerified,
  setMaidDisabled,
  setMaidAssured,
  setMaidAvailability,
} from '../../features/maids/maidsSlice';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import { TextInput, Select, Checkbox, FileInput } from '../../components/common/FormField';
import CountrySelect from '../../components/common/CountrySelect';
import RichTextEditor from '../../components/common/RichTextEditor';
import { mediaUrl } from '../../utils/mediaUrl';
import { joinPhone, splitPhone } from '../../constants/countries';
import {
  DAYS_OFF,
  EDUCATION,
  LANGUAGE_LEVELS,
  LANGUAGES,
  LIVE_OPTIONS,
  LOCATIONS,
  MARITAL_STATUSES,
  RELIGIONS,
  SALARIES,
  SERVICES,
  SKILLS,
  VISA_STATUSES,
  optionToSalary,
  salaryToOption,
} from '../../constants/maidFormOptions';

// Must match what Backend1 accepts (utils/fileUpload/fileUpload.js and mutifileUpload.js);
// anything else makes the API fail with a generic 500.
const PROFILE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const DOCUMENT_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
const toAccept = (types) => types.map((t) => `.${t}`).join(',');
const invalidFiles = (files, types) =>
  Array.from(files || []).filter((f) => !types.includes(f.name.split('.').pop().toLowerCase()));

// Same tabs, fields and order as the website's job page (/register?as=job).
const TABS = ['Personal Details', 'Contact', 'Other Details', 'Employment History', 'Additional Info'];

// Required field → [label, tab index]. Checked on submit; the form jumps to the first tab with an error.
const REQUIRED = {
  name: ['Name', 0],
  age: ['Age', 0],
  marital_status: ['Marital Status', 0],
  nationality: ['Nationality', 0],
  location: ['Location', 0],
  religion: ['Religion', 0],
  service: ['Service', 0],
  salaryOption: ['Salary', 0],
  education: ['Education', 0],
  email: ['Email', 0],
  date: ['Date', 0],
  day_of: ['Day Off', 0],
  current_location: ['Current Location', 1],
};

const emptyLanguage = { name: '', read: '0', write: '0', speak: '0' };
const emptyJob = { title: '', location: '', experiance: '', reason_leaving: '', job_description: '' };

const emptyForm = {
  // Personal details
  name: '',
  age: '',
  marital_status: '',
  nationality: '',
  location: '',
  religion: '',
  service: '',
  salaryOption: '',
  education: '',
  email: '',
  date: new Date().toISOString().slice(0, 10),
  day_of: '',
  // Contact
  uae_code: 'AE',
  uae_no: '',
  botim_code: 'AE',
  botim_number: '',
  whatsapp_code: 'AE',
  whatsapp_no: '',
  current_location: '',
  // Other details
  youtube_link: '',
  available_from: '',
  visa_status: '',
  visa_expire: '',
  skills: [],
  option: '',
  languages: [],
  // Employment history
  employmentHistory: [],
  // Additional info
  notes: '',
  availability: true,
  references: false,
};

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');

// Keeps a value from an older profile selectable even if it isn't one of today's options.
const withCurrent = (options, value) =>
  value && !options.some((o) => o.value === value) ? [...options, { value, label: value.replace('-', ' to ') }] : options;

// Empty numbers default to the UAE code; older numbers saved without "+" keep no code so they're saved as typed.
const phoneFields = (value) => {
  const { code, number } = splitPhone(value);
  return { code: code || (number ? '' : 'AE'), number };
};

// Maps a saved profile onto the form state.
function toForm(maid) {
  const uae = phoneFields(maid.uae_no || maid.mobile);
  const botim = phoneFields(maid.botim_number);
  const whatsapp = phoneFields(maid.whatsapp_no);
  return {
    ...emptyForm,
    name: maid.name ?? '',
    age: maid.age ?? '',
    marital_status: maid.marital_status ?? '',
    nationality: maid.nationality ?? '',
    location: maid.location ?? '',
    religion: maid.religion ?? '',
    service: maid.service ?? '',
    salaryOption: salaryToOption(maid.salary, maid.is_negotiable_salary),
    education: maid.education ?? '',
    email: maid.email ?? '',
    date: dateOnly(maid.date),
    day_of: maid.day_of ?? '',
    uae_code: uae.code,
    uae_no: uae.number,
    botim_code: botim.code,
    botim_number: botim.number,
    whatsapp_code: whatsapp.code,
    whatsapp_no: whatsapp.number,
    current_location: maid.current_location ?? '',
    youtube_link: maid.youtube_link ?? '',
    available_from: maid.available_from ?? '',
    visa_status: maid.visa_status ?? '',
    visa_expire: dateOnly(maid.visa_expire),
    skills: maid.skills || [],
    option: maid.option ?? '',
    languages: (maid.language || []).map((l) => ({
      name: l.name ?? '',
      read: String(l.read ?? 0),
      write: String(l.write ?? 0),
      speak: String(l.speak ?? 0),
    })),
    employmentHistory: (maid.employmentHistory || []).map((j) => ({
      title: j.title ?? '',
      location: j.location ?? '',
      experiance: j.experiance ?? '',
      reason_leaving: j.reason_leaving ?? '',
      job_description: j.job_description ?? '',
    })),
    notes: maid.notes ?? '',
    availability: !!maid.availability,
    references: !!maid.references,
  };
}

function Row({ label, htmlFor, required, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}

function OptionSelect({ id, value, onChange, options, placeholder }) {
  return (
    <Select id={id} value={value} onChange={onChange}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

function PhoneRow({ id, label, code, number, onCode, onNumber }) {
  return (
    <Row label={label} htmlFor={id}>
      <div className="flex rounded-lg border border-gray-300 bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        <div className="shrink-0 border-r border-gray-200">
          <CountrySelect mode="dial" value={code} onChange={onCode} ariaLabel={`${label} country code`} />
        </div>
        <input
          id={id}
          type="tel"
          value={number}
          onChange={(e) => onNumber(e.target.value)}
          placeholder="50 123 4567"
          className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>
    </Row>
  );
}

const sectionCls = 'rounded-xl border border-gray-200 bg-white p-5';

export default function MaidFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentStatus } = useSelector((state) => state.maids);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) dispatch(fetchMaidDashboard(id));
    return () => dispatch(clearCurrentMaid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isEdit && current) setForm(toForm(current));
  }, [current, isEdit]);

  const profilePreview = useMemo(() => (form.profileFile ? URL.createObjectURL(form.profileFile) : null), [form.profileFile]);
  useEffect(() => () => profilePreview && URL.revokeObjectURL(profilePreview), [profilePreview]);

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };
  const set = (key) => (e) => update({ [key]: e.target.value });
  const setValue = (key) => (value) => update({ [key]: value });
  const setBool = (key) => (e) => update({ [key]: e.target.checked });

  const setListItem = (list, i, patch) =>
    update({ [list]: form[list].map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  const removeListItem = (list, i) => update({ [list]: form[list].filter((_, idx) => idx !== i) });

  const toggleSkill = (skill) =>
    update({ skills: form.skills.includes(skill) ? form.skills.filter((s) => s !== skill) : [...form.skills, skill] });

  const tabErrors = TABS.map((_, i) => Object.keys(errors).some((k) => REQUIRED[k]?.[1] === i));

  const validate = () => {
    const found = {};
    Object.entries(REQUIRED).forEach(([key, [label]]) => {
      if (!String(form[key] ?? '').trim()) found[key] = `${label} is required`;
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) found.email = 'Enter a valid email address';
    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    if (Object.keys(found).length) {
      setErrors(found);
      setTab(Math.min(...Object.keys(found).map((k) => REQUIRED[k]?.[1] ?? 0)));
      toast.error('Please fill in the required fields');
      return;
    }

    const badProfile = invalidFiles(form.profileFile ? [form.profileFile] : [], PROFILE_TYPES);
    if (badProfile.length) {
      toast.error(`Profile photo must be ${PROFILE_TYPES.join(', ')} (got "${badProfile[0].name}")`);
      return;
    }
    const badDocs = invalidFiles(form.wordFiles, DOCUMENT_TYPES);
    if (badDocs.length) {
      toast.error(`Documents must be ${DOCUMENT_TYPES.join(', ')} — not allowed: ${badDocs.map((f) => f.name).join(', ')}`);
      return;
    }

    setSubmitting(true);

    const uae = joinPhone(form.uae_code, form.uae_no);
    const botim = joinPhone(form.botim_code, form.botim_number);
    const whatsapp = joinPhone(form.whatsapp_code, form.whatsapp_no);
    const { salary, is_negotiable_salary } = optionToSalary(form.salaryOption);

    const fields = {
      ...(isEdit ? { _id: id } : {}),
      name: form.name,
      age: form.age,
      marital_status: form.marital_status,
      nationality: form.nationality,
      location: form.location,
      religion: form.religion,
      service: form.service,
      salary: JSON.stringify(salary),
      is_negotiable_salary,
      education: form.education,
      email: form.email,
      date: form.date,
      day_of: form.day_of,
      // `mobile` is the main contact number, as in the original admin form.
      mobile: uae || whatsapp || botim || current?.mobile,
      uae_no: uae,
      botim_number: botim,
      whatsapp_no: whatsapp,
      current_location: form.current_location,
      youtube_link: form.youtube_link,
      available_from: form.available_from,
      visa_status: form.visa_status,
      visa_expire: form.visa_expire,
      skills: form.skills,
      option: form.option,
      language: form.languages
        .filter((l) => l.name)
        .map((l) => ({ name: l.name, read: Number(l.read), write: Number(l.write), speak: Number(l.speak) })),
      employmentHistory: form.employmentHistory
        .map((j) => ({ ...j, experiance: j.experiance === '' ? undefined : Number(j.experiance) }))
        .filter((j) => j.title || j.location || j.experiance || j.reason_leaving || j.job_description),
      notes: form.notes,
      availability: form.availability,
      references: form.references,
      profile: form.profileFile || undefined,
      wordfiles: form.wordFiles || undefined,
    };

    const action = isEdit ? updateMaid(fields) : createMaid(fields);
    const result = await dispatch(action);
    setSubmitting(false);
    if ((isEdit ? updateMaid : createMaid).fulfilled.match(result)) {
      navigate('/maids');
    }
  };

  if (isEdit && currentStatus === 'loading') {
    return <p className="text-sm text-gray-500">Loading maid profile…</p>;
  }

  const profileSrc = profilePreview || (isEdit && current?.profile ? mediaUrl(current.profile) : null);
  const extraSkills = form.skills.filter((s) => !SKILLS.includes(s));

  return (
    <div className="w-full">
      <PageHeader
        title={isEdit ? `Edit Maid — ${form.name || ''}` : 'Add New Maid'}
        actions={
          isEdit && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => dispatch(setMaidVerified({ id, verified: current?.status !== 1 }))}>
                {current?.status === 1 ? 'Un-verify' : 'Verify'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => dispatch(setMaidDisabled({ id, disabled: current?.status !== 3 }))}>
                {current?.status === 3 ? 'Enable' : 'Disable'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => dispatch(setMaidAssured({ id, assured: !current?.is_assured }))}>
                {current?.is_assured ? 'Remove Assured' : 'Mark Assured'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => dispatch(setMaidAvailability({ id, available: !current?.availability }))}>
                {current?.availability ? 'Mark Unavailable' : 'Mark Available'}
              </Button>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Maid profile sections" className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1">
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === i ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                tab === i ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </span>
            {label}
            {tabErrors[i] && <span className="h-2 w-2 rounded-full bg-red-500" aria-label="has errors" />}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ── Personal Details ── */}
        {tab === 0 && (
          <section className={sectionCls}>
            <div className="mb-5 flex items-center gap-5">
              <label className="relative flex h-48 w-48 sm:h-72 sm:w-72 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-brand-500">
                {profileSrc ? (
                  <img src={profileSrc} alt="Profile" className="absolute inset-0 h-full w-full object-cover" decoding="async" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-brand-500" />
                )}
                <input
                  type="file"
                  accept={toAccept(PROFILE_TYPES)}
                  className="sr-only"
                  aria-label="Profile photo"
                  onChange={(e) => e.target.files[0] && update({ profileFile: e.target.files[0] })}
                />
              </label>
              <div>
                <p className="text-sm font-semibold text-gray-700">Profile</p>
                <p className="text-xs text-gray-400">JPG, PNG or WEBP. Click the image to {profileSrc ? 'change' : 'upload'}.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Row label="Name" htmlFor="m_name" required error={errors.name}>
                <TextInput id="m_name" value={form.name} onChange={set('name')} placeholder="Name" />
              </Row>
              <Row label="Age" htmlFor="m_age" required error={errors.age}>
                <TextInput id="m_age" type="number" value={form.age} onChange={set('age')} placeholder="Age" />
              </Row>
              <Row label="Marital Status" htmlFor="m_marital" required error={errors.marital_status}>
                <OptionSelect
                  id="m_marital"
                  value={form.marital_status}
                  onChange={set('marital_status')}
                  options={withCurrent(MARITAL_STATUSES, form.marital_status)}
                  placeholder="Select Marital Status"
                />
              </Row>
              <Row label="Nationality" htmlFor="m_nationality" required error={errors.nationality}>
                <CountrySelect
                  id="m_nationality"
                  mode="name"
                  value={form.nationality}
                  onChange={setValue('nationality')}
                  placeholder="Select Nationality"
                  hasError={!!errors.nationality}
                />
              </Row>
              <Row label="Location" htmlFor="m_location" required error={errors.location}>
                <OptionSelect
                  id="m_location"
                  value={form.location}
                  onChange={set('location')}
                  options={withCurrent(LOCATIONS, form.location)}
                  placeholder="Select Location"
                />
              </Row>
              <Row label="Religion" htmlFor="m_religion" required error={errors.religion}>
                <OptionSelect
                  id="m_religion"
                  value={form.religion}
                  onChange={set('religion')}
                  options={withCurrent(RELIGIONS, form.religion)}
                  placeholder="Select Religion"
                />
              </Row>
              <Row label="Service" htmlFor="m_service" required error={errors.service}>
                <OptionSelect
                  id="m_service"
                  value={form.service}
                  onChange={set('service')}
                  options={withCurrent(SERVICES, form.service)}
                  placeholder="Select Service"
                />
              </Row>
              <Row label="Salary (AED / month)" htmlFor="m_salary" required error={errors.salaryOption}>
                <OptionSelect
                  id="m_salary"
                  value={form.salaryOption}
                  onChange={set('salaryOption')}
                  options={withCurrent(SALARIES, form.salaryOption)}
                  placeholder="Select Salary"
                />
              </Row>
              <Row label="Education" htmlFor="m_education" required error={errors.education}>
                <OptionSelect
                  id="m_education"
                  value={form.education}
                  onChange={set('education')}
                  options={withCurrent(EDUCATION, form.education)}
                  placeholder="Select Education"
                />
              </Row>
              <Row label="Email" htmlFor="m_email" required error={errors.email}>
                <TextInput id="m_email" type="email" value={form.email} onChange={set('email')} placeholder="Email" />
              </Row>
              <Row label="Date" htmlFor="m_date" required error={errors.date}>
                <TextInput id="m_date" type="date" value={form.date} onChange={set('date')} />
              </Row>
              <Row label="Day Off" htmlFor="m_dayoff" required error={errors.day_of}>
                <OptionSelect
                  id="m_dayoff"
                  value={form.day_of}
                  onChange={set('day_of')}
                  options={withCurrent(DAYS_OFF, form.day_of)}
                  placeholder="Select Day Off"
                />
              </Row>
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {tab === 1 && (
          <section className={sectionCls}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhoneRow
                id="m_uae"
                label="UAE Calling Number"
                code={form.uae_code}
                number={form.uae_no}
                onCode={setValue('uae_code')}
                onNumber={setValue('uae_no')}
              />
              <PhoneRow
                id="m_botim"
                label="Botim Calling Number"
                code={form.botim_code}
                number={form.botim_number}
                onCode={setValue('botim_code')}
                onNumber={setValue('botim_number')}
              />
              <PhoneRow
                id="m_whatsapp"
                label="Whatsapp Number"
                code={form.whatsapp_code}
                number={form.whatsapp_no}
                onCode={setValue('whatsapp_code')}
                onNumber={setValue('whatsapp_no')}
              />
              <Row label="Current Location" htmlFor="m_clocation" required error={errors.current_location}>
                <TextInput id="m_clocation" value={form.current_location} onChange={set('current_location')} placeholder="Current Location" />
              </Row>
            </div>
          </section>
        )}

        {/* ── Other Details ── */}
        {tab === 2 && (
          <>
            <section className={sectionCls}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Row label="Youtube Link" htmlFor="m_youtube">
                  <TextInput id="m_youtube" value={form.youtube_link} onChange={set('youtube_link')} placeholder="Youtube Link" />
                </Row>
                <Row label="Available from" htmlFor="m_available_from">
                  <TextInput id="m_available_from" value={form.available_from} onChange={set('available_from')} placeholder="Available from" />
                </Row>
                <Row label="Visa Status" htmlFor="m_visa_status">
                  <OptionSelect
                    id="m_visa_status"
                    value={form.visa_status}
                    onChange={set('visa_status')}
                    options={withCurrent(VISA_STATUSES, form.visa_status)}
                    placeholder="Select Visa Status"
                  />
                </Row>
                <Row label="Visa expire" htmlFor="m_visa_expire">
                  <TextInput id="m_visa_expire" type="date" value={form.visa_expire} onChange={set('visa_expire')} />
                </Row>
                <Row label="Options" htmlFor="m_option" className="sm:col-span-2">
                  <OptionSelect
                    id="m_option"
                    value={form.option}
                    onChange={set('option')}
                    options={withCurrent(LIVE_OPTIONS, form.option)}
                    placeholder="Select Options"
                  />
                </Row>
              </div>
            </section>

            <section className={sectionCls}>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {[...SKILLS, ...extraSkills].map((skill) => {
                  const on = form.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleSkill(skill)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-gray-700 hover:border-brand-500 hover:text-brand-600'
                      }`}
                    >
                      {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={sectionCls}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Languages</h3>
                <Button type="button" variant="secondary" size="sm" onClick={() => update({ languages: [...form.languages, emptyLanguage] })}>
                  <Plus className="h-3.5 w-3.5" /> {form.languages.length === 0 ? 'Add Language' : 'Add Another Language'}
                </Button>
              </div>
              {form.languages.length === 0 && <p className="text-sm text-gray-400">No languages added</p>}
              <div className="space-y-3">
                {form.languages.map((lang, i) => (
                  <div key={i} className="grid grid-cols-3 items-end gap-2 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                    <Row label="Languages" htmlFor={`m_lang_${i}`} className="col-span-3 sm:col-span-1">
                      <OptionSelect
                        id={`m_lang_${i}`}
                        value={lang.name}
                        onChange={(e) => setListItem('languages', i, { name: e.target.value })}
                        options={withCurrent(
                          LANGUAGES.map((l) => ({ value: l, label: l })),
                          lang.name,
                        )}
                        placeholder="Select language"
                      />
                    </Row>
                    {['read', 'write', 'speak'].map((skill) => (
                      <Row key={skill} label={skill[0].toUpperCase() + skill.slice(1)} htmlFor={`m_lang_${i}_${skill}`}>
                        <OptionSelect
                          id={`m_lang_${i}_${skill}`}
                          value={lang[skill]}
                          onChange={(e) => setListItem('languages', i, { [skill]: e.target.value })}
                          options={LANGUAGE_LEVELS.map((l) => ({ value: String(l.value), label: l.label }))}
                        />
                      </Row>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeListItem('languages', i)} aria-label="Remove language">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Employment History ── */}
        {tab === 3 && (
          <section className={sectionCls}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Employment History</h3>
              <Button type="button" variant="secondary" size="sm" onClick={() => update({ employmentHistory: [...form.employmentHistory, emptyJob] })}>
                <Plus className="h-3.5 w-3.5" /> {form.employmentHistory.length === 0 ? 'Add Employment History' : 'Add New Employment History'}
              </Button>
            </div>
            {form.employmentHistory.length === 0 && <p className="text-sm text-gray-400">No employment history added</p>}
            <div className="space-y-4">
              {form.employmentHistory.map((job, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Job {i + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeListItem('employmentHistory', i)}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Row label="Title" htmlFor={`m_job_${i}_title`}>
                      <TextInput id={`m_job_${i}_title`} value={job.title} onChange={(e) => setListItem('employmentHistory', i, { title: e.target.value })} />
                    </Row>
                    <Row label="Location" htmlFor={`m_job_${i}_location`}>
                      <TextInput id={`m_job_${i}_location`} value={job.location} onChange={(e) => setListItem('employmentHistory', i, { location: e.target.value })} />
                    </Row>
                    <Row label="Duration (years)" htmlFor={`m_job_${i}_duration`}>
                      <TextInput
                        id={`m_job_${i}_duration`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={job.experiance}
                        onChange={(e) => setListItem('employmentHistory', i, { experiance: e.target.value })}
                      />
                    </Row>
                    <Row label="Reason For Leaving" htmlFor={`m_job_${i}_reason`}>
                      <TextInput
                        id={`m_job_${i}_reason`}
                        value={job.reason_leaving}
                        onChange={(e) => setListItem('employmentHistory', i, { reason_leaving: e.target.value })}
                      />
                    </Row>
                    <Row label="Job Description" htmlFor={`m_job_${i}_description`} className="sm:col-span-2">
                      <RichTextEditor
                        id={`m_job_${i}_description`}
                        value={job.job_description}
                        onChange={(html) => setListItem('employmentHistory', i, { job_description: html })}
                        minHeight={110}
                      />
                    </Row>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Additional Info ── */}
        {tab === 4 && (
          <>
            <section className={sectionCls}>
              <Row label="Notes" htmlFor="m_notes">
                <RichTextEditor id="m_notes" value={form.notes} onChange={setValue('notes')} minHeight={160} />
              </Row>
              <div className="mt-4 flex flex-wrap gap-4">
                <Checkbox label="Available for hire" checked={form.availability} onChange={setBool('availability')} />
                <Checkbox label="Has references" checked={form.references} onChange={setBool('references')} />
              </div>
            </section>

            {isEdit && current?.video && (
              <section className={sectionCls}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Intro Video</h3>
                  <a href={mediaUrl(current.video)} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:underline">
                    Open in new tab
                  </a>
                </div>
                <video key={current.video} src={mediaUrl(current.video)} controls preload="metadata" className="max-h-[480px] w-full rounded-lg bg-black" />
              </section>
            )}

            <section className={sectionCls}>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Documents</h3>
              {isEdit && current?.word_file?.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {current.word_file.map((doc, i) => (
                    <li key={doc._id || i}>
                      <a href={mediaUrl(doc.image)} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline">
                        {doc.name || `Document ${i + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <FileInput multiple accept={toAccept(DOCUMENT_TYPES)} onChange={(e) => update({ wordFiles: e.target.files })} />
              <span className="mt-1 block text-xs text-gray-400">PDF or images (JPG, PNG, WEBP). You can select multiple files</span>
            </section>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/maids')}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {tab > 0 && (
              <Button type="button" variant="secondary" onClick={() => setTab(tab - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
            )}
            {tab < TABS.length - 1 && (
              <Button type="button" variant="secondary" onClick={() => setTab(tab + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save Changes' : 'Create Application'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

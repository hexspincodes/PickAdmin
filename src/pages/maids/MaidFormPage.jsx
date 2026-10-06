import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
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
import Badge from '../../components/common/Badge';
import { Field, TextInput, TextArea, Select, Checkbox, FileInput } from '../../components/common/FormField';
import { mediaUrl } from '../../utils/mediaUrl';

// Must match what Backend1 accepts (utils/fileUpload/fileUpload.js and mutifileUpload.js);
// anything else makes the API fail with a generic 500.
const PROFILE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];
const DOCUMENT_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
const toAccept = (types) => types.map((t) => `.${t}`).join(',');
const invalidFiles = (files, types) =>
  Array.from(files || []).filter((f) => !types.includes(f.name.split('.').pop().toLowerCase()));

const emptyForm = {
  name: '',
  email: '',
  mobile: '',
  age: '',
  nationality: '',
  marital_status: '',
  location: '',
  religion: '',
  service: '',
  current_location: '',
  uae_no: '',
  whatsapp_no: '',
  botim_number: '',
  youtube_link: '',
  visa_status: '',
  visa_expire: '',
  available_from: '',
  education: '',
  notes: '',
  day_of: '',
  is_negotiable_salary: false,
  references: false,
  availability: false,
  salaryFrom: '',
  salaryTo: '',
  skills: [],
  languages: [],
  employmentHistory: [],
};

function ChipInput({ items, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState('');
  const add = () => {
    const v = value.trim();
    if (v && !items.includes(v)) onAdd(v);
    setValue('');
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} tone="brand" className="gap-1">
            {item}
            <button type="button" onClick={() => onRemove(item)} className="ml-1 text-brand-500 hover:text-brand-800">
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MaidFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, currentStatus } = useSelector((state) => state.maids);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) dispatch(fetchMaidDashboard(id));
    return () => dispatch(clearCurrentMaid());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (isEdit && current) {
      setForm({
        ...emptyForm,
        ...current,
        salaryFrom: current.salary?.from ?? '',
        salaryTo: current.salary?.to ?? '',
        skills: current.skills || [],
        languages: current.language || [],
        employmentHistory: current.employmentHistory || [],
      });
    }
  }, [current, isEdit]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setBool = (key) => (e) => setForm({ ...form, [key]: e.target.checked });

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    const fields = {
      ...(isEdit ? { _id: id } : {}),
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      age: form.age,
      nationality: form.nationality,
      marital_status: form.marital_status,
      location: form.location,
      religion: form.religion,
      service: form.service,
      current_location: form.current_location,
      uae_no: form.uae_no,
      whatsapp_no: form.whatsapp_no,
      botim_number: form.botim_number,
      youtube_link: form.youtube_link,
      visa_status: form.visa_status,
      visa_expire: form.visa_expire,
      available_from: form.available_from,
      education: form.education,
      notes: form.notes,
      day_of: form.day_of,
      is_negotiable_salary: form.is_negotiable_salary,
      references: form.references,
      availability: form.availability,
      salary: JSON.stringify({ from: Number(form.salaryFrom) || 0, to: Number(form.salaryTo) || 0 }),
      skills: JSON.stringify(form.skills),
      language: JSON.stringify(form.languages),
      employmentHistory: JSON.stringify(form.employmentHistory),
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

  return (
    <div className="mx-auto max-w-3xl">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {isEdit && current?.video && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Intro Video</h3>
              <a
                href={mediaUrl(current.video)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Open in new tab
              </a>
            </div>
            <video
              key={current.video}
              src={mediaUrl(current.video)}
              controls
              preload="metadata"
              className="max-h-[480px] w-full rounded-lg bg-black"
            />
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <TextInput required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Mobile">
              <TextInput value={form.mobile} onChange={set('mobile')} />
            </Field>
            <Field label="Age">
              <TextInput type="number" value={form.age} onChange={set('age')} />
            </Field>
            <Field label="Nationality">
              <TextInput value={form.nationality} onChange={set('nationality')} />
            </Field>
            <Field label="Marital Status">
              <TextInput value={form.marital_status} onChange={set('marital_status')} />
            </Field>
            <Field label="Religion">
              <TextInput value={form.religion} onChange={set('religion')} />
            </Field>
            <Field label="Service">
              <TextInput value={form.service} onChange={set('service')} placeholder="e.g. Maid, Nanny, Cook" />
            </Field>
            <Field label="Location">
              <TextInput value={form.location} onChange={set('location')} />
            </Field>
            <Field label="Current Location">
              <TextInput value={form.current_location} onChange={set('current_location')} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Contact</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="UAE Number">
              <TextInput value={form.uae_no} onChange={set('uae_no')} />
            </Field>
            <Field label="WhatsApp Number">
              <TextInput value={form.whatsapp_no} onChange={set('whatsapp_no')} />
            </Field>
            <Field label="Botim Number">
              <TextInput value={form.botim_number} onChange={set('botim_number')} />
            </Field>
            <Field label="YouTube Link">
              <TextInput value={form.youtube_link} onChange={set('youtube_link')} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Visa & Availability</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Visa Status">
              <TextInput value={form.visa_status} onChange={set('visa_status')} />
            </Field>
            <Field label="Visa Expiry">
              <TextInput type="date" value={form.visa_expire} onChange={set('visa_expire')} />
            </Field>
            <Field label="Available From">
              <TextInput type="date" value={form.available_from} onChange={set('available_from')} />
            </Field>
            <Field label="Day Off">
              <TextInput value={form.day_of} onChange={set('day_of')} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            <Checkbox label="Available for hire" checked={form.availability} onChange={setBool('availability')} />
            <Checkbox label="Has references" checked={form.references} onChange={setBool('references')} />
            <Checkbox label="Salary negotiable" checked={form.is_negotiable_salary} onChange={setBool('is_negotiable_salary')} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Salary (monthly, AED)</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From">
              <TextInput type="number" value={form.salaryFrom} onChange={set('salaryFrom')} />
            </Field>
            <Field label="To">
              <TextInput type="number" value={form.salaryTo} onChange={set('salaryTo')} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Skills</h3>
          <ChipInput
            items={form.skills}
            onAdd={(v) => setForm({ ...form, skills: [...form.skills, v] })}
            onRemove={(v) => setForm({ ...form, skills: form.skills.filter((s) => s !== v) })}
            placeholder="Add a skill and press Enter"
          />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Languages</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  languages: [...form.languages, { name: '', read: 0, write: 0, speak: 0 }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Language
            </Button>
          </div>
          {form.languages.length === 0 && <p className="text-sm text-gray-400">No languages added</p>}
          <div className="space-y-2">
            {form.languages.map((lang, i) => (
              <div key={i} className="flex items-center gap-2">
                <TextInput
                  placeholder="Language"
                  value={lang.name}
                  onChange={(e) => {
                    const languages = [...form.languages];
                    languages[i] = { ...languages[i], name: e.target.value };
                    setForm({ ...form, languages });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, languages: form.languages.filter((_, idx) => idx !== i) })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Employment History</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setForm({
                  ...form,
                  employmentHistory: [
                    ...form.employmentHistory,
                    { title: '', job_description: '', experiance: '', reason_leaving: '', location: '' },
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Entry
            </Button>
          </div>
          {form.employmentHistory.length === 0 && <p className="text-sm text-gray-400">No employment history added</p>}
          <div className="space-y-4">
            {form.employmentHistory.map((entry, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-white p-3">
                <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <TextInput
                    placeholder="Title"
                    value={entry.title}
                    onChange={(e) => {
                      const employmentHistory = [...form.employmentHistory];
                      employmentHistory[i] = { ...employmentHistory[i], title: e.target.value };
                      setForm({ ...form, employmentHistory });
                    }}
                  />
                  <TextInput
                    placeholder="Location"
                    value={entry.location}
                    onChange={(e) => {
                      const employmentHistory = [...form.employmentHistory];
                      employmentHistory[i] = { ...employmentHistory[i], location: e.target.value };
                      setForm({ ...form, employmentHistory });
                    }}
                  />
                </div>
                <TextArea
                  rows={2}
                  placeholder="Job description"
                  value={entry.job_description}
                  onChange={(e) => {
                    const employmentHistory = [...form.employmentHistory];
                    employmentHistory[i] = { ...employmentHistory[i], job_description: e.target.value };
                    setForm({ ...form, employmentHistory });
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, employmentHistory: form.employmentHistory.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Notes & Education</h3>
          <div className="space-y-4">
            <Field label="Education">
              <TextInput value={form.education} onChange={set('education')} />
            </Field>
            <Field label="Notes">
              <TextArea rows={3} value={form.notes} onChange={set('notes')} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">Files</h3>
          <div className="space-y-4">
            <Field label="Profile Photo">
              <FileInput accept={toAccept(PROFILE_TYPES)} onChange={(e) => setForm({ ...form, profileFile: e.target.files[0] })} />
            </Field>
            <Field label="Supporting Documents" hint="PDF or images (JPG, PNG, WEBP). You can select multiple files">
              <FileInput
                multiple
                accept={toAccept(DOCUMENT_TYPES)}
                onChange={(e) => setForm({ ...form, wordFiles: e.target.files })}
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/maids')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}

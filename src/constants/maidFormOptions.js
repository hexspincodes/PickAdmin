// Dropdown options for the maid profile form (website /register?as=job and the
// admin panel's Add/Edit Maid). `value` is what gets stored in the database —
// these match the original admin panel so new profiles line up with existing
// data and the search filters. Keep in sync with
// pick_frontend src/lib/maidFormOptions.ts.


const same = (values) => values.map((v) => ({ value: v, label: v }));

export const MARITAL_STATUSES = [
  { value: "married", label: "Married" },
  { value: "single", label: "Single" },
  { value: "divorced", label: "Divorced" },
  { value: "separated", label: "Separated" },
  { value: "widowed", label: "Widowed" },
  { value: "Single Parent", label: "Single Parent" },
];

export const LOCATIONS = same([
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
  "Al Ain",
]);

export const RELIGIONS = [
  { value: "christian", label: "Christian" },
  { value: "hinduism", label: "Hinduism" },
  { value: "islam", label: "Islam" },
  { value: "buddhist", label: "Buddhist" },
  { value: "sikhism", label: "Sikhism" },
];

export const SERVICES = same([
  "Maid",
  "Nanny",
  "Caregiver",
  "Private Nurse",
  "Private Tutor",
  "Driver",
  "Postpartum care",
  "Cook",
]);

// Stored as salary { from, to } + is_negotiable_salary; see salaryToOption/optionToSalary.
export const SALARIES = [
  { value: "1300-1500", label: "1300 to 1500" },
  { value: "1500-1800", label: "1500 to 1800" },
  { value: "1700-2000", label: "1700 to 2000" },
  { value: "1800-2200", label: "1800 to 2200" },
  { value: "2000-2500", label: "2000 to 2500" },
  { value: "2300-2800", label: "2300 to 2800" },
  { value: "2500-3000", label: "2500 to 3000" },
  { value: "3000-3500", label: "3000 to 3500" },
  { value: "negotiable", label: "Negotiable" },
];

export const EDUCATION = [
  { value: "school", label: "School (secondary)" },
  { value: "degree", label: "Degree/diploma" },
];

export const DAYS_OFF = same(["Weekly", "twice a month"]);

export const VISA_STATUSES = same([
  "Visit Visa",
  "Employment Visa",
  "Own Visa",
  "Husband Visa",
  "To Be Cancel",
  "Cancelled Visa",
]);

export const SKILLS = [
  "Newborn Care",
  "Child Care",
  "Cooking",
  "Assisting in Kitchen",
  "Private Tutor",
  "Private Nurse",
  "Elderly Care",
  "Caregiver",
  "Postpartum Care",
  "Private Driver",
  "Pet Care",
  "Gardening",
  "Car Washing",
  "Cleaning/Housekeeping",
];

// Stored in the `option` field.
export const LIVE_OPTIONS = [
  { value: "Live In", label: "Live-In" },
  { value: "Live Out", label: "Live-Out" },
  { value: "Live In And Live Out", label: "Live In And Live Out" },
];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
  "Telugu",
  "Bengali",
  "Kannada",
  "Marathi",
  "Punjabi",
  "Sinhala",
  "Urdu",
  "Nepali",
  "Burmese",
  "Bhutan",
  "Arabic",
  "Amharic",
  "French",
  "Tagalog",
  "Swahili",
  "Indonesian",
  "Shona",
  "Tigrinya",
];

// Read / write / speak level, stored as a number.
export const LANGUAGE_LEVELS = [
  { value: 0, label: "good" },
  { value: 1, label: "excellent" },
  { value: 2, label: "fair" },
  { value: 3, label: "don’t know" },
];

export function optionToSalary(option) {
  if (option === "negotiable") {
    return { salary: { from: 0, to: 0 }, is_negotiable_salary: true };
  }
  const [from, to] = option.split("-").map(Number);
  return { salary: { from: from || 0, to: to || 0 }, is_negotiable_salary: false };
}

export function salaryToOption(salary, negotiable) {
  if (negotiable) return "negotiable";
  if (!salary?.from && !salary?.to) return "";
  return `${salary.from ?? 0}-${salary.to ?? 0}`;
}

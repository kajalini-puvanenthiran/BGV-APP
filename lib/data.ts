export type Role = "Admin" | "Client" | "Candidate";
export type CaseStatus =
  "In progress" | "Completed" | "Needs attention" | "Pending";
export type Candidate = {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  status: CaseStatus;
  progress: number;
  created: string;
  color: string;
  checks: string[];
};
export type Check = {
  id: string;
  title: string;
  category: string;
  days: string;
  icon: string;
  color: string;
  documents: string[];
  enabled: boolean;
  required: boolean;
};
export type Upload = {
  id: string;
  candidateId: string;
  checkId: string;
  requirement: string;
  name: string;
  size: number;
  type: string;
  uploaded: string;
  status: "In review" | "Approved" | "Rejected";
  note?: string;
};
export type Activity = {
  id: string;
  text: string;
  detail: string;
  time: string;
  icon: string;
  color: string;
};
export type Settings = {
  maintenance: boolean;
  candidatePortal: boolean;
  clientPortal: boolean;
  uploads: boolean;
  newCases: boolean;
  exports: boolean;
  requireConsent: boolean;
  maxFileSize: number;
  theme: "Dark" | "Light" | "System";
  workspace: string;
  notifications: boolean;
};
export const initialSettings: Settings = {
  maintenance: false,
  candidatePortal: true,
  clientPortal: true,
  uploads: true,
  newCases: true,
  exports: true,
  requireConsent: true,
  maxFileSize: 10,
  theme: "Dark",
  workspace: "Acme Corporation",
  notifications: true,
};
export const checklist: Check[] = [
  {
    id: "address",
    title: "Address verification",
    category: "Address",
    days: "2–5",
    icon: "location-outline",
    color: "#eac76b",
    documents: [
      "Grama Niladhari certificate",
      "Copy of National Identity Card",
      "Copy of utility bill",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "comprehensive",
    title: "Comprehensive criminal check",
    category: "Criminal",
    days: "7–12",
    icon: "shield-outline",
    color: "#729fe7",
    documents: ["Online police clearance certificate", "Copy of passport"],
    enabled: true,
    required: true,
  },
  {
    id: "credit",
    title: "Credit background check",
    category: "Financial",
    days: "2–4",
    icon: "card-outline",
    color: "#43cead",
    documents: ["CRIB report", "Copy of passport"],
    enabled: true,
    required: true,
  },
  {
    id: "crib",
    title: "CRIB background check",
    category: "Financial",
    days: "5–7",
    icon: "business-outline",
    color: "#eac76b",
    documents: [
      "Local police clearance certificate",
      "Copy of National Identity Card",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "criminal",
    title: "Criminal background check",
    category: "Criminal",
    days: "5–7",
    icon: "scale-outline",
    color: "#729fe7",
    documents: [
      "Copy of National Identity Card",
      "Police report",
      "Authorization form",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "current-address",
    title: "Current address check",
    category: "Address",
    days: "2–4",
    icon: "home-outline",
    color: "#43cead",
    documents: [
      "GS certificate",
      "Copy of National Identity Card",
      "Utility bill",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "cv",
    title: "CV validation",
    category: "Employment",
    days: "2–3",
    icon: "document-text-outline",
    color: "#729fe7",
    documents: ["Current curriculum vitae"],
    enabled: true,
    required: true,
  },
  {
    id: "education",
    title: "Education background check",
    category: "Education",
    days: "5–7",
    icon: "school-outline",
    color: "#5dc7db",
    documents: [
      "Education verification form",
      "Qualification certificates / transcripts",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "employment",
    title: "Employment background check",
    category: "Employment",
    days: "5–7",
    icon: "briefcase-outline",
    color: "#43cead",
    documents: [
      "Employment verification form",
      "Service letter / resignation acceptance letter",
    ],
    enabled: true,
    required: true,
  },
  {
    id: "global",
    title: "Global database check",
    category: "Criminal",
    days: "1–2",
    icon: "globe-outline",
    color: "#eac76b",
    documents: ["Copy of National Identity Card"],
    enabled: true,
    required: true,
  },
  {
    id: "nic",
    title: "Local ID (NIC) check",
    category: "Identity",
    days: "1–2",
    icon: "id-card-outline",
    color: "#43cead",
    documents: ["No objection letter", "Copy of National Identity Card"],
    enabled: true,
    required: true,
  },
  {
    id: "license",
    title: "Professional license check",
    category: "Education",
    days: "3–5",
    icon: "ribbon-outline",
    color: "#eac76b",
    documents: ["Education form", "Membership certificate"],
    enabled: true,
    required: false,
  },
  {
    id: "reference",
    title: "Reference check",
    category: "Reference",
    days: "3–5",
    icon: "people-outline",
    color: "#a390ee",
    documents: ["Reference 1 contact details", "Reference 2 contact details"],
    enabled: true,
    required: true,
  },
  {
    id: "drug",
    title: "Drug screening",
    category: "Health",
    days: "2–3",
    icon: "flask-outline",
    color: "#43cead",
    documents: [
      "Copy of National Identity Card",
      "Contact details and screening consent",
    ],
    enabled: true,
    required: false,
  },
];
export const companies = [
  "Acme Corporation",
  "Linear Technologies",
  "Vertex Solutions",
  "Apex Global",
  "Horizon Group",
  "Nova Digital",
];
export const defaultClientChecklists: Record<string, string[]> = {
  "Acme Corporation": [
    "address",
    "criminal",
    "education",
    "employment",
    "nic",
    "reference",
    "cv",
    "current-address",
  ],
  "Linear Technologies": [
    "nic",
    "cv",
    "education",
    "employment",
    "reference",
    "comprehensive",
  ],
  "Vertex Solutions": [
    "address",
    "nic",
    "credit",
    "crib",
    "employment",
    "criminal",
  ],
  "Apex Global": [
    "global",
    "nic",
    "cv",
    "education",
    "employment",
    "license",
  ],
  "Horizon Group": [
    "address",
    "nic",
    "cv",
    "education",
    "employment",
    "reference",
  ],
  "Nova Digital": [
    "nic",
    "cv",
    "education",
    "employment",
    "reference",
    "criminal",
  ],
};
const names = [
  "Olivia Rhye",
  "Phoenix Baker",
  "Lana Steiner",
  "Demi Wilkinson",
  "Drew Cano",
  "Natali Craig",
  "Orlando Diggs",
  "Andi Lane",
  "Kate Morrison",
  "Ravi Perera",
  "Sarah Chen",
  "James Wilson",
  "Amelia Taylor",
  "Liam Johnson",
  "Maya Patel",
  "Noah Williams",
  "Sofia Garcia",
  "Ethan Brown",
  "Ava Martin",
  "Leo Anderson",
];
const surnames = [
  "Silva",
  "Walker",
  "Singh",
  "Lee",
  "Thomas",
  "White",
  "Fernando",
  "Harris",
  "Clarke",
  "Robinson",
  "Lewis",
  "Hall",
];
const colors = [
  "#9982bd",
  "#6e94a7",
  "#b79773",
  "#799e89",
  "#8d94c3",
  "#b77b8c",
];
export const initialCandidates: Candidate[] = Array.from(
  { length: 248 },
  (_, i) => {
    const name =
      i < names.length
        ? names[i]
        : names[i % names.length].split(" ")[0] +
          " " +
          surnames[Math.floor(i / names.length) - 1];
    const status: CaseStatus =
      i === 0
        ? "In progress"
        : i === 1
          ? "Completed"
          : i === 2
            ? "Needs attention"
            : i === 3
              ? "In progress"
              : i === 4
                ? "Completed"
                : i === 5
                  ? "Pending"
                  : i % 12 < 8
                    ? "Completed"
                    : i % 12 < 11
                      ? "In progress"
                      : "Needs attention";
    return {
      id: `BGV-${String(2026001 + i)}`,
      name,
      email: name.toLowerCase().replace(" ", ".") + "@example.com",
      company: companies[i % 6],
      position: [
        "Product Designer",
        "Software Engineer",
        "Marketing Manager",
        "Finance Analyst",
        "People Operations",
        "Product Manager",
      ][i % 6],
      status,
      progress:
        status === "Completed"
          ? 100
          : status === "Pending"
            ? 0
            : status === "Needs attention"
              ? 42
              : 64 + (i % 3) * 10,
      created: `2026-09-${String(i < 12 ? 25 - i : 1 + Math.floor(24 * Math.sqrt((i - 12) / 236))).padStart(2, "0")}`,
      color: colors[i % 6],
      checks: checklist.map((c) => c.id),
    };
  },
);
export const initialActivities: Activity[] = [
  {
    id: "a1",
    text: "Verification completed",
    detail: "Phoenix Baker · Linear Technologies",
    time: "2026-09-25T08:50:00Z",
    icon: "checkmark-circle-outline",
    color: "#42dfae",
  },
  {
    id: "a2",
    text: "Documents need your attention",
    detail: "Lana Steiner · Address verification",
    time: "2026-09-25T08:30:00Z",
    icon: "alert-circle-outline",
    color: "#efbd68",
  },
  {
    id: "a3",
    text: "New candidate added",
    detail: "Demi Wilkinson · Apex Global",
    time: "2026-09-25T08:00:00Z",
    icon: "person-add-outline",
    color: "#7ba6ea",
  },
  {
    id: "a4",
    text: "Verification completed",
    detail: "Drew Cano · Horizon Group",
    time: "2026-09-25T07:00:00Z",
    icon: "checkmark-circle-outline",
    color: "#42dfae",
  },
];

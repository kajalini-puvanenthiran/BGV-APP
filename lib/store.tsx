import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Activity,
  Candidate,
  Check,
  Upload,
  Role,
  Settings,
  initialActivities,
  initialCandidates,
  initialSettings,
  checklist,
  companies,
  defaultClientChecklists,
} from "./data";
export const darkPalette = {
  bg: "#0b1118",
  sidebar: "#0d141b",
  panel: "#111a23",
  raised: "#16212b",
  border: "#23303c",
  text: "#eef2f6",
  muted: "#8695a5",
  subtle: "#5e7082",
  green: "#48dfb1",
  greenBg: "#18382f",
  blue: "#77a6ef",
  amber: "#efc16e",
  purple: "#aa94e9",
  danger: "#ed8792",
  dark: true,
};
export const lightPalette = {
  bg: "#f4f7f9",
  sidebar: "#ffffff",
  panel: "#ffffff",
  raised: "#f0f4f7",
  border: "#e0e6ed",
  text: "#172636",
  muted: "#647486",
  subtle: "#8694a2",
  green: "#168362",
  greenBg: "#e1f4ec",
  blue: "#3b72c9",
  amber: "#ad701c",
  purple: "#805bbb",
  danger: "#bd4558",
  dark: false,
};
type Store = {
  organizations: string[];
  setOrganizations: React.Dispatch<React.SetStateAction<string[]>>;
  clientChecklists: Record<string, string[]>;
  setClientChecklists: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  getClientCheckIds: (companyName: string) => string[];
  role: Role;
  setRole: (r: Role) => void;
  candidates: Candidate[];
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
  checks: Check[];
  setChecks: React.Dispatch<React.SetStateAction<Check[]>>;
  uploads: Upload[];
  setUploads: React.Dispatch<React.SetStateAction<Upload[]>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  activities: Activity[];
  log: (text: string, detail: string, icon?: string, color?: string) => void;
  loaded: boolean;
  toast: (t: string) => void;
  message: string;
  palette: typeof darkPalette;
  scoped: Candidate[];
  selectedCandidate: string;
  setSelectedCandidate: (id: string) => void;
  selectedClient: string;
  setSelectedClient: (client: string) => void;
  selectCandidateAndClient: (candidateId: string) => void;
  consented: boolean;
  setConsented: (v: boolean) => void;
};
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState(companies);
  const [clientChecklists, setClientChecklists] = useState<
    Record<string, string[]>
  >(defaultClientChecklists);
  const [role, setRole] = useState<Role>("Admin");
  const [candidates, setCandidates] = useState(initialCandidates);
  const [checks, setChecks] = useState(checklist);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [settings, setSettings] = useState(initialSettings);
  const [activities, setActivities] = useState(initialActivities);
  const [consented, setConsented] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("BGV-2026001");
  const [selectedClient, setSelectedClient] = useState("Acme Corporation");
  const scheme = useColorScheme();
  useEffect(() => {
    AsyncStorage.getItem("bgv-workspace-v1")
      .then((value) => {
        if (value) {
          const data = JSON.parse(value);
          if (data.organizations) setOrganizations(data.organizations);
          if (data.clientChecklists)
            setClientChecklists((prev) => ({
              ...defaultClientChecklists,
              ...data.clientChecklists,
            }));
          if (data.checks) {
            const migratedChecks = data.checks.map((c: any) => {
              let cat = c.category;
              if (cat === "Employment & education") {
                cat =
                  c.id === "education" || c.id === "license"
                    ? "Education"
                    : c.id === "reference"
                      ? "Reference"
                      : "Employment";
              } else if (cat === "Identity & address") {
                cat = c.id === "nic" ? "Identity" : "Address";
              } else if (cat === "Criminal & financial") {
                cat =
                  c.id === "credit" || c.id === "crib"
                    ? "Financial"
                    : "Criminal";
              } else if (cat === "Health & screening") {
                cat = "Health";
              }
              return { ...c, category: cat };
            });
            setChecks(migratedChecks);
          }
          if (data.settings)
            setSettings({ ...initialSettings, ...data.settings });
          if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0)
            setCandidates(data.candidates);
          if (data.uploads && Array.isArray(data.uploads))
            setUploads(data.uploads);
          if (data.activities) setActivities(data.activities);
          if (data.consented) setConsented(true);
          if (data.selectedCandidate) setSelectedCandidate(data.selectedCandidate);
          if (data.selectedClient) setSelectedClient(data.selectedClient);
        }
      })
      .catch(() =>
        setMessage(
          "Saved workspace could not be loaded. Demo data is available.",
        ),
      )
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded)
      AsyncStorage.setItem(
        "bgv-workspace-v1",
        JSON.stringify({
          organizations,
          clientChecklists,
          candidates,
          checks,
          uploads,
          settings,
          activities,
          consented,
          selectedCandidate,
          selectedClient,
        }),
      ).catch(() =>
        setMessage(
          "Could not save changes on this device. Check available storage.",
        ),
      );
  }, [
    organizations,
    clientChecklists,
    candidates,
    checks,
    uploads,
    settings,
    activities,
    consented,
    selectedCandidate,
    selectedClient,
    loaded,
  ]);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(t);
    }
  }, [message]);
  const log = (
    text: string,
    detail: string,
    icon = "time-outline",
    color = "#48dfb1",
  ) =>
    setActivities((a) =>
      [
        {
          id: Date.now().toString() + Math.random(),
          text,
          detail,
          time: new Date().toISOString(),
          icon,
          color,
        },
        ...a,
      ].slice(0, 100),
    );
  const palette =
    settings.theme === "Light" ||
    (settings.theme === "System" && scheme === "light")
      ? lightPalette
      : darkPalette;
  const selectCandidateAndClient = (candidateId: string) => {
    setSelectedCandidate(candidateId);
    const found = candidates.find((c) => c.id === candidateId);
    if (found) {
      setSelectedClient(found.company);
    }
  };
  const scoped = useMemo(() => {
    if (role === "Admin") return candidates;
    if (
      settings.maintenance ||
      (role === "Client" && !settings.clientPortal) ||
      (role === "Candidate" && !settings.candidatePortal)
    )
      return [];
    if (role === "Client") {
      return candidates.filter(
        (c) => c.company === (selectedClient || "Acme Corporation"),
      );
    }
    const found = candidates.find((c) => c.id === selectedCandidate);
    return found ? [found] : candidates.slice(0, 1);
  }, [
    role,
    candidates,
    selectedCandidate,
    selectedClient,
    settings.maintenance,
    settings.clientPortal,
    settings.candidatePortal,
  ]);
  const getClientCheckIds = (companyName: string): string[] => {
    if (
      clientChecklists[companyName] &&
      clientChecklists[companyName].length > 0
    ) {
      return clientChecklists[companyName];
    }
    return checks.filter((c) => c.enabled).map((c) => c.id);
  };
  return (
    <Context.Provider
      value={{
        organizations,
        setOrganizations,
        clientChecklists,
        setClientChecklists,
        getClientCheckIds,
        role,
        setRole,
        candidates,
        setCandidates,
        checks,
        setChecks,
        uploads,
        setUploads,
        settings,
        setSettings,
        activities,
        log,
        loaded,
        toast: setMessage,
        message,
        palette,
        scoped,
        selectedCandidate,
        setSelectedCandidate,
        selectedClient,
        setSelectedClient,
        selectCandidateAndClient,
        consented,
        setConsented,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);

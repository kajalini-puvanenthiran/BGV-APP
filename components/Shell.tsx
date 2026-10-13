import React, { useEffect, useState } from "react";
import { View, Pressable, useWindowDimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useStore } from "../lib/store";
import { Role } from "../lib/data";
import { navigateTo, openCase } from "../lib/navigation";
import {
  T,
  Icon,
  Avatar,
  Button,
  Dialog,
  Search,
  Empty,
  IconButton,
  Badge,
} from "./ui";
import Dashboard from "../screens/Dashboard";
import Candidates from "../screens/Candidates";
import Checklist from "../screens/Checklist";
import Settings from "../screens/Settings";
import Reports from "../screens/Reports";
import Clients from "../screens/Clients";
import { CandidateSelectDialog } from "./CandidateSelectDialog";
const Tab = createBottomTabNavigator();
const navItems = [
  { name: "Dashboard", label: "Overview", icon: "grid-outline" },
  { name: "Candidates", label: "Candidates", icon: "people-outline" },
  {
    name: "Verifications",
    label: "Verifications",
    icon: "shield-checkmark-outline",
  },
  { name: "Checklist", label: "Document checklist", icon: "list-outline" },
  { name: "Reports", label: "Reports & activity", icon: "bar-chart-outline" },
  { name: "Clients", label: "Clients", icon: "business-outline" },
  { name: "Settings", label: "Settings", icon: "settings-outline" },
];
function Gate({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { settings, role, palette: p } = useStore();
  if (adminOnly && role !== "Admin")
    return (
      <View style={{ flex: 1, backgroundColor: p.bg }}>
        <Empty
          title="Administrator access only"
          description="This section is only available in the Admin portal."
          icon="lock-closed-outline"
        />
      </View>
    );
  if (
    role !== "Admin" &&
    (settings.maintenance ||
      (role === "Client" && !settings.clientPortal) ||
      (role === "Candidate" && !settings.candidatePortal))
  )
    return (
      <View
        style={{ flex: 1, backgroundColor: p.bg, justifyContent: "center" }}
      >
        <Empty
          icon="lock-closed-outline"
          title={
            settings.maintenance
              ? "We’ll be right back."
              : "This portal is currently restricted."
          }
          description={
            settings.maintenance
              ? "Your administrator has enabled maintenance mode. Your information is safe on this device."
              : "Your administrator has temporarily disabled access to this portal. Switch to the Admin portal to manage access."
          }
        />
      </View>
    );
  return <>{children}</>;
}
const Home = () => (
  <Gate>
    <Dashboard />
  </Gate>
);
const People = () => (
  <Gate>
    <Candidates />
  </Gate>
);
const Verification = () => (
  <Gate>
    <Candidates verification />
  </Gate>
);
const Documents = () => (
  <Gate>
    <Checklist />
  </Gate>
);
const Reporting = () => (
  <Gate>
    <Reports />
  </Gate>
);
const Organizations = () => (
  <Gate adminOnly>
    <Clients />
  </Gate>
);
const Preferences = () => (
  <Gate>
    <Settings />
  </Gate>
);
export default function Shell() {
  const {
    palette: p,
    role,
    setRole,
    settings,
    scoped,
    activities,
    toast,
    candidates,
    selectedCandidate,
    selectedClient,
    selectCandidateAndClient,
  } = useStore();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const [active, setActive] = useState("Dashboard");
  const [portal, setPortal] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [candidateSelectOpen, setCandidateSelectOpen] = useState(false);

  const currentCandidate =
    candidates.find((c) => c.id === selectedCandidate) || candidates[0];

  const allowed = navItems.filter(
    (item) =>
      role === "Admin" ||
      (role === "Client"
        ? item.name !== "Clients"
        : ["Dashboard", "Verifications", "Checklist", "Settings"].includes(
            item.name,
          )),
  );
  const user =
    role === "Admin"
      ? "Alex Morgan"
      : role === "Client"
        ? "Jordan Miller"
        : (currentCandidate?.name || "Candidate");
  const blocked =
    role !== "Admin" &&
    (settings.maintenance ||
      (role === "Client" && !settings.clientPortal) ||
      (role === "Candidate" && !settings.candidatePortal));
  const searchWorkspace = () =>
    blocked
      ? toast("This portal is restricted by your administrator.")
      : setSearch(true);
  useEffect(() => {
    if (Platform.OS === "web") {
      const listener = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "k") {
          event.preventDefault();
          searchWorkspace();
        }
        if (event.key === "Escape") {
          setSearch(false);
          setPortal(false);
          setNotifications(false);
          setHelp(false);
        }
      };
      window.addEventListener("keydown", listener);
      return () => window.removeEventListener("keydown", listener);
    }
  }, [blocked]);
  const navRow = (item: (typeof navItems)[number]) => (
    <Pressable
      key={item.name}
      accessibilityRole="button"
      accessibilityLabel={`Navigate to ${item.label}`}
      onPress={() => navigateTo(item.name)}
      style={({ hovered }: any) => ({
        marginHorizontal: 13,
        paddingHorizontal: 13,
        paddingVertical: 11,
        borderRadius: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 5,
        backgroundColor:
          active === item.name
            ? p.green + "13"
            : hovered
              ? p.raised
              : "transparent",
        borderWidth: 1,
        borderColor: active === item.name ? p.green + "18" : "transparent",
      })}
    >
      <Icon
        name={item.icon}
        size={18}
        color={active === item.name ? p.green : p.muted}
      />
      <T
        weight={active === item.name ? "semibold" : "medium"}
        style={{
          fontSize: 11,
          color: active === item.name ? p.green : p.muted,
          flex: 1,
        }}
      >
        {item.label}
      </T>
      {item.name === "Candidates" && (
        <T
          style={{
            fontSize: 9,
            color: active === item.name ? p.green : p.subtle,
            backgroundColor: active === item.name ? p.green + "12" : p.raised,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 4,
          }}
        >
          {scoped.length}
        </T>
      )}
      {item.name === "Verifications" && (
        <View
          style={{
            height: 5,
            width: 5,
            borderRadius: 3,
            backgroundColor: p.amber,
          }}
        />
      )}
    </Pressable>
  );
  const showNotifications = () =>
    blocked
      ? toast("This portal is restricted by your administrator.")
      : settings.notifications
        ? setNotifications(true)
        : toast("In-app notifications are disabled in Settings.");
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: p.sidebar }}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View
            style={{
              width: 228,
              backgroundColor: p.sidebar,
              borderRightWidth: 1,
              borderColor: p.border,
            }}
          >
            <View
              style={{
                height: 78,
                paddingHorizontal: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View style={{ position: "relative" }}>
                <Icon name="shield-checkmark" size={31} color={p.green} />
              </View>
              <T weight="heading" style={{ fontSize: 20, letterSpacing: -0.8 }}>
                BGV
                <T
                  weight="heading"
                  style={{ fontSize: 20, color: p.text, letterSpacing: -0.8 }}
                >
                  {" "}
                  Checker
                </T>
              </T>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: p.border,
                marginHorizontal: 20,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Switch portal"
              onPress={() => setPortal(true)}
              style={({ hovered }: any) => ({
                padding: 12,
                marginHorizontal: 17,
                marginTop: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: p.border,
                borderRadius: 7,
                backgroundColor: hovered ? p.raised : p.panel,
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
              })}
            >
              <View
                style={{
                  height: 29,
                  width: 29,
                  borderRadius: 6,
                  backgroundColor: p.greenBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name={
                    role === "Admin"
                      ? "shield-checkmark-outline"
                      : role === "Client"
                        ? "business-outline"
                        : "person-outline"
                  }
                  size={16}
                  color={p.green}
                />
              </View>
              <View style={{ flex: 1 }}>
                <T weight="semibold" style={{ fontSize: 11 }}>
                  {role} portal
                </T>
                <T
                  muted
                  style={{ fontSize: 9, lineHeight: 15 }}
                  numberOfLines={1}
                >
                  {settings.workspace}
                </T>
              </View>
              <Icon name="chevron-expand-outline" size={14} />
            </Pressable>
            <T
              style={{
                fontSize: 9,
                letterSpacing: 1.4,
                color: p.subtle,
                marginLeft: 27,
                marginBottom: 12,
              }}
            >
              WORKSPACE
            </T>
            {allowed
              .filter((i) => !["Clients", "Settings"].includes(i.name))
              .map(navRow)}
            <T
              style={{
                fontSize: 9,
                letterSpacing: 1.4,
                color: p.subtle,
                marginLeft: 27,
                marginBottom: 12,
                marginTop: 23,
              }}
            >
              {role === "Admin" ? "ADMINISTRATION" : "PREFERENCES"}
            </T>
            {allowed
              .filter((i) => ["Clients", "Settings"].includes(i.name))
              .map(navRow)}
            <View style={{ flex: 1, minHeight: 25 }} />
            <View
              style={{
                margin: 17,
                marginBottom: 16,
                padding: 17,
                borderWidth: 1,
                borderColor: p.green + "20",
                borderRadius: 9,
                backgroundColor: p.green + "07",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  right: -17,
                  top: -25,
                  width: 105,
                  height: 105,
                  borderRadius: 70,
                  borderWidth: 1,
                  borderColor: p.green + "13",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  right: -2,
                  top: -10,
                  width: 75,
                  height: 75,
                  borderRadius: 70,
                  borderWidth: 1,
                  borderColor: p.green + "13",
                }}
              />
              <Icon name="sparkles-outline" color={p.green} size={20} />
              <T
                weight="semibold"
                style={{ fontSize: 12, lineHeight: 19, marginTop: 12 }}
              >
                Better checks.{"\n"}Brighter beginnings.
              </T>
              <T muted style={{ fontSize: 10, lineHeight: 17, marginTop: 7 }}>
                A little clarity goes a long way.
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Explore the checklist"
                onPress={() => navigateTo("Checklist")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 15,
                }}
              >
                <T weight="medium" style={{ fontSize: 10, color: p.green }}>
                  Explore the checklist
                </T>
                <Icon name="arrow-forward" size={13} color={p.green} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Help and support"
              onPress={() => setHelp(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
                paddingHorizontal: 27,
                paddingVertical: 15,
              }}
            >
              <Icon name="help-circle-outline" size={18} />
              <T muted style={{ fontSize: 11 }}>
                Help & support
              </T>
              <Icon name="arrow-up-right-box-outline" size={13} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Account and portal"
              onPress={() => setPortal(true)}
              style={{
                padding: 19,
                paddingVertical: 19,
                borderTopWidth: 1,
                borderColor: p.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Avatar name={user} color="#97a693" size={34} />
              <View style={{ flex: 1 }}>
                <T weight="semibold" style={{ fontSize: 11 }}>
                  {user}
                </T>
                <T muted style={{ fontSize: 9, lineHeight: 16 }}>
                  {role === "Admin"
                    ? "Super administrator"
                    : role === "Client"
                      ? "Client manager"
                      : "Candidate"}
                </T>
              </View>
              <Icon name="ellipsis-vertical" size={16} />
            </Pressable>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              height: 70,
              borderBottomWidth: 1,
              borderColor: p.border,
              backgroundColor: p.sidebar,
              paddingHorizontal: desktop ? 30 : 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {desktop ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 11 }}
              >
                <Icon name="home-outline" size={15} />
                <T muted style={{ fontSize: 11 }}>
                  Workspace
                </T>
                <Icon name="chevron-forward" size={11} />
                <T weight="medium" style={{ fontSize: 11 }}>
                  {navItems.find((i) => i.name === active)?.label}
                </T>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch portal"
                onPress={() => setPortal(true)}
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Icon name="shield-checkmark" color={p.green} size={26} />
                <View>
                  <T weight="heading" style={{ fontSize: 16 }}>
                    BGV Checker
                  </T>
                  <T muted style={{ fontSize: 9, lineHeight: 14 }}>
                    {role} portal
                  </T>
                </View>
                <Icon name="chevron-down" size={12} />
              </Pressable>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: desktop ? 16 : 9,
              }}
            >
              {role === "Candidate" && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch active candidate"
                  onPress={() => setCandidateSelectOpen(true)}
                  style={({ hovered }: any) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: p.green + "44",
                    backgroundColor: hovered ? p.greenBg : p.raised,
                  })}
                >
                  <Icon name="person" size={13} color={p.green} />
                  <T weight="medium" style={{ fontSize: 11, color: p.text }}>
                    {currentCandidate?.name} ({currentCandidate?.company})
                  </T>
                  <Icon name="chevron-down" size={12} color={p.muted} />
                </Pressable>
              )}
              {desktop && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Search workspace"
                  onPress={searchWorkspace}
                  style={{
                    height: 33,
                    width: 235,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    borderWidth: 1,
                    borderColor: p.border,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    backgroundColor: p.bg,
                  }}
                >
                  <Icon name="search-outline" size={14} />
                  <T muted style={{ fontSize: 10, flex: 1 }}>
                    Search anything...
                  </T>
                  <T
                    style={{
                      fontSize: 9,
                      color: p.subtle,
                      borderWidth: 1,
                      borderColor: p.border,
                      borderRadius: 3,
                      paddingHorizontal: 4,
                      lineHeight: 16,
                    }}
                  >
                    ⌘ K
                  </T>
                </Pressable>
              )}
              {width > 1160 && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: p.green,
                    }}
                  />
                  <T muted style={{ fontSize: 9 }}>
                    Workspace ready
                  </T>
                </View>
              )}
              {!desktop && (
                <IconButton
                  name="help-circle-outline"
                  label="Help and support"
                  onPress={() => setHelp(true)}
                  size={19}
                />
              )}
              {!desktop && (
                <IconButton
                  name="search-outline"
                  label="Search workspace"
                  onPress={searchWorkspace}
                  size={19}
                />
              )}
              <View>
                <IconButton
                  name="notifications-outline"
                  label="Notifications"
                  onPress={showNotifications}
                />
                {settings.notifications && (
                  <View
                    style={{
                      position: "absolute",
                      right: 9,
                      top: 8,
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: p.green,
                      borderWidth: 1,
                      borderColor: p.sidebar,
                    }}
                  />
                )}
              </View>
              {desktop && (
                <View
                  style={{ width: 1, height: 23, backgroundColor: p.border }}
                />
              )}
              {desktop && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch account portal"
                  onPress={() => setPortal(true)}
                >
                  <Avatar name={user} color="#97a693" size={31} />
                </Pressable>
              )}
            </View>
          </View>
          <Tab.Navigator
            initialRouteName="Dashboard"
            screenListeners={({ route }) => ({
              focus: () => setActive(route.name),
            })}
            screenOptions={({ route }) => {
              const item = navItems.find((i) => i.name === route.name)!;
              const visible =
                role === "Candidate"
                  ? [
                      "Dashboard",
                      "Checklist",
                      "Verifications",
                      "Settings",
                    ].includes(route.name)
                  : [
                      "Dashboard",
                      "Candidates",
                      "Checklist",
                      "Reports",
                      "Settings",
                    ].includes(route.name);
              return {
                headerShown: false,
                animation: "none",
                tabBarStyle: desktop
                  ? { display: "none" }
                  : {
                      backgroundColor: p.sidebar,
                      borderTopColor: p.border,
                      height: 74,
                      paddingTop: 7,
                      paddingBottom: 10,
                    },
                tabBarItemStyle: { display: visible ? "flex" : "none" },
                tabBarActiveTintColor: p.green,
                tabBarInactiveTintColor: p.muted,
                tabBarAccessibilityLabel: item.label,
                tabBarLabelStyle: {
                  fontFamily: "Inter_500Medium",
                  fontSize: 9,
                  marginTop: 4,
                },
                tabBarLabel:
                  route.name === "Dashboard"
                    ? "Overview"
                    : route.name === "Checklist"
                      ? "Checklist"
                      : route.name === "Verifications"
                        ? "My case"
                        : route.name === "Reports"
                          ? "Reports"
                          : item.label,
                tabBarIcon: ({ color, size }) => (
                  <Icon name={item.icon} color={color} size={20} />
                ),
                tabBarButton: visible ? undefined : () => null,
                sceneStyle: { backgroundColor: p.bg },
              };
            }}
          >
            <Tab.Screen name="Dashboard" component={Home} />
            <Tab.Screen name="Candidates" component={People} />
            <Tab.Screen name="Verifications" component={Verification} />
            <Tab.Screen name="Checklist" component={Documents} />
            <Tab.Screen name="Reports" component={Reporting} />
            <Tab.Screen name="Clients" component={Organizations} />
            <Tab.Screen name="Settings" component={Preferences} />
          </Tab.Navigator>
        </View>
      </View>
      <Dialog
        visible={portal}
        onClose={() => setPortal(false)}
        title="One platform. Three perspectives."
        description="Switch portals to explore each demo experience."
      >
        {(
          [
            {
              role: "Admin",
              icon: "shield-checkmark-outline",
              title: "Admin portal",
              text: "Manage every case, client, document, and app-wide control.",
              color: p.green,
            },
            {
              role: "Client",
              icon: "business-outline",
              title: "Client portal",
              text: "View Acme Corporation’s candidates, verifications, and reports.",
              color: p.blue,
            },
            {
              role: "Candidate",
              icon: "person-outline",
              title: "Candidate portal",
              text: `Continue as ${currentCandidate?.name || "Candidate"} · ${currentCandidate?.company || "Client"}. Upload documents and track your progress.`,
              color: p.purple,
            },
          ] as const
        ).map((option) => (
          <Pressable
            key={option.role}
            accessibilityRole="button"
            accessibilityLabel={`Open ${option.role} portal`}
            onPress={() => {
              setRole(option.role);
              setPortal(false);
              navigateTo("Dashboard");
            }}
            style={({ hovered }: any) => ({
              padding: 17,
              borderWidth: 1,
              borderColor:
                role === option.role ? option.color + "66" : p.border,
              borderRadius: 8,
              backgroundColor:
                role === option.role
                  ? option.color + "0c"
                  : hovered
                    ? p.raised
                    : p.bg,
              flexDirection: "row",
              gap: 13,
              alignItems: "center",
            })}
          >
            <Icon name={option.icon} color={option.color} size={25} />
            <View style={{ flex: 1, gap: 5 }}>
              <T weight="semibold" style={{ fontSize: 14 }}>
                {option.title}
              </T>
              <T muted style={{ fontSize: 11, lineHeight: 18 }}>
                {option.text}
              </T>
            </View>
            <Icon
              name={role === option.role ? "checkmark-circle" : "arrow-forward"}
              color={role === option.role ? option.color : p.muted}
            />
          </Pressable>
        ))}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 12,
            borderRadius: 7,
            backgroundColor: p.raised,
            borderWidth: 1,
            borderColor: p.border,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <T weight="medium" style={{ fontSize: 11 }}>
              Select candidate for client
            </T>
            <T muted style={{ fontSize: 10 }}>
              Current: {currentCandidate?.name} ({currentCandidate?.company}) · No default lock
            </T>
          </View>
          <Button
            label="Select candidate"
            icon="people-outline"
            variant="secondary"
            small
            onPress={() => setCandidateSelectOpen(true)}
          />
        </View>
        <View
          style={{ flexDirection: "row", gap: 7, alignItems: "flex-start" }}
        >
          <Icon name="information-circle-outline" size={15} />
          <T muted style={{ fontSize: 10, lineHeight: 17, flex: 1 }}>
            Demo accounts only. This switcher previews role-based workflows; it
            is not a secure sign-in mechanism.
          </T>
        </View>
      </Dialog>
      <Dialog
        visible={search}
        onClose={() => setSearch(false)}
        title="Find your next step"
        description="Search candidates, organizations, or case numbers."
      >
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Search your workspace..."
        />
        {scoped
          .filter((c) =>
            (c.name + c.email + c.company + c.id)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .slice(0, 6)
          .map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Search result ${c.name}`}
              onPress={() => {
                setSearch(false);
                openCase(c.id);
              }}
              style={({ hovered }: any) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 7,
                backgroundColor: hovered ? p.raised : p.bg,
              })}
            >
              <Avatar name={c.name} color={c.color} />
              <View style={{ flex: 1 }}>
                <T weight="medium">{c.name}</T>
                <T muted style={{ fontSize: 10 }}>
                  {c.company} · {c.id}
                </T>
              </View>
              <Icon name="arrow-forward" size={16} />
            </Pressable>
          ))}
        {!scoped.some((c) =>
          (c.name + c.email + c.company + c.id)
            .toLowerCase()
            .includes(query.toLowerCase()),
        ) && (
          <Empty
            title="No matching candidates"
            description="Try a name, organization, or case number."
          />
        )}
      </Dialog>
      <Dialog
        visible={notifications}
        onClose={() => setNotifications(false)}
        title="Your workspace, in the loop"
        description="Recent updates from your local demo workspace."
      >
        {activities
          .filter(
            (a) =>
              role === "Admin" ||
              a.detail.includes(role === "Candidate" ? "Olivia" : "Acme"),
          )
          .slice(0, 8)
          .map((a) => (
            <View
              key={a.id}
              style={{
                flexDirection: "row",
                gap: 13,
                paddingBottom: 14,
                borderBottomWidth: 1,
                borderColor: p.border,
              }}
            >
              <Icon name={a.icon} color={a.color} />
              <View style={{ flex: 1, gap: 4 }}>
                <T weight="medium" style={{ fontSize: 12 }}>
                  {a.text}
                </T>
                <T muted style={{ fontSize: 11 }}>
                  {a.detail}
                </T>
              </View>
            </View>
          ))}
        {!activities.some(
          (a) =>
            role === "Admin" ||
            a.detail.includes(role === "Candidate" ? "Olivia" : "Acme"),
        ) && (
          <Empty
            title="You’re all caught up"
            description="New updates will appear here as your verification progresses."
            icon="notifications-outline"
          />
        )}
        <Button
          label="View all activity"
          variant="secondary"
          onPress={() => {
            setNotifications(false);
            navigateTo("Reports");
          }}
        />
      </Dialog>
      <Dialog
        visible={help}
        onClose={() => setHelp(false)}
        title="A little help goes a long way."
        description="Your quick guide to BGV Checker."
      >
        {[
          {
            title: "Start a verification",
            text: "Choose New verification, add a candidate, and assign a client. The active checklist is attached to the case.",
          },
          {
            title: "Collect documents",
            text: "Open Document checklist, choose a candidate, and upload sample PDF, JPG, or PNG files. Candidates can upload only for their own case.",
          },
          {
            title: "Review with confidence",
            text: "Open a candidate’s case to approve documents, request changes, and update the verification status.",
          },
          {
            title: "Stay in control",
            text: "Settings lets an administrator control portal access, uploads, exports, new cases, and maintenance mode.",
          },
        ].map((x) => (
          <View key={x.title} style={{ gap: 6 }}>
            <T weight="semibold">{x.title}</T>
            <T muted style={{ fontSize: 12, lineHeight: 20 }}>
              {x.text}
            </T>
          </View>
        ))}
        {Platform.OS === "web" && (
          <Button
            label="Download source code"
            variant="secondary"
            icon="code-slash-outline"
            onPress={() => {
              const a = document.createElement("a");
              a.href = "/bgv-checker-source.zip";
              a.download = "bgv-checker-source.zip";
              a.click();
            }}
          />
        )}
        <Button
          label="Got it, let’s get started"
          onPress={() => setHelp(false)}
        />
      </Dialog>
      <CandidateSelectDialog
        visible={candidateSelectOpen}
        onClose={() => setCandidateSelectOpen(false)}
        initialCompany={currentCandidate?.company}
        onSelected={() => {
          if (portal) {
            setRole("Candidate");
            setPortal(false);
            navigateTo("Dashboard");
          }
        }}
      />
    </SafeAreaView>
  );
}

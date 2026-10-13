import React, { useEffect, useState } from "react";
import { View, Switch, useWindowDimensions } from "react-native";
import { useStore } from "../lib/store";
import { Settings as SettingsType } from "../lib/data";
import {
  Page,
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Chips,
  Field,
  Badge,
} from "../components/ui";
export default function Settings() {
  const { palette: p, settings, setSettings, role, log, toast } = useStore();
  const { width } = useWindowDimensions();
  const [draft, setDraft] = useState(settings);
  const [tab, setTab] = useState("Access & controls");
  useEffect(() => setDraft(settings), [settings]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const admin = role === "Admin";
  const update = (key: keyof SettingsType, value: any) =>
    setDraft((s) => ({ ...s, [key]: value }));
  const save = () => {
    if (!draft.workspace.trim()) {
      toast("Please enter a workspace name.");
      return;
    }
    if (admin) setSettings({ ...draft, workspace: draft.workspace.trim() });
    else
      setSettings((s) => ({
        ...s,
        theme: draft.theme,
        notifications: draft.notifications,
      }));
    log(
      "Workspace settings updated",
      `${role} portal · ${admin ? tab : "Preferences"}`,
      "options-outline",
    );
    toast("Your workspace settings have been saved.");
  };
  const row = (
    key: keyof SettingsType,
    title: string,
    description: string,
    icon: string,
    danger = false,
  ) => (
    <View
      key={key}
      style={{
        paddingVertical: 21,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderColor: p.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
      }}
    >
      <View
        style={{
          padding: 9,
          borderRadius: 7,
          backgroundColor: danger ? p.amber + "13" : p.raised,
        }}
      >
        <Icon name={icon} color={danger ? p.amber : p.muted} size={20} />
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <T weight="medium" style={{ fontSize: 13 }}>
          {title}
        </T>
        <T muted style={{ fontSize: 11, lineHeight: 18, maxWidth: 640 }}>
          {description}
        </T>
      </View>
      <Switch
        accessibilityLabel={title}
        value={Boolean(draft[key])}
        onValueChange={(v) => update(key, v)}
        trackColor={{ false: p.border, true: p.green }}
        thumbColor={p.dark ? "#eff9f4" : undefined}
      />
    </View>
  );
  return (
    <Page>
      <PageHeading
        eyebrow="MAKE IT YOUR WORKSPACE"
        title={admin ? "Your workspace, your rules." : "A little more you."}
        description={
          admin
            ? "Set the boundaries. Keep your people and your process protected."
            : "Manage how BGV Checker looks and keeps you informed."
        }
        actions={
          <Button
            label="Save changes"
            icon="checkmark"
            onPress={save}
            disabled={!dirty}
          />
        }
      />
      {admin && (
        <View style={{ marginBottom: 24 }}>
          <Chips
            items={[
              "Access & controls",
              "General",
              "Appearance",
              "Notifications",
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
      )}
      {admin && tab === "Access & controls" ? (
        <>
          <View
            style={{ flexDirection: width > 1100 ? "row" : "column", gap: 22 }}
          >
            <View style={{ flex: 2, gap: 22 }}>
              <Panel>
                <View
                  style={{
                    padding: 23,
                    borderBottomWidth: 1,
                    borderColor: p.border,
                    gap: 5,
                  }}
                >
                  <T weight="semibold" style={{ fontSize: 15 }}>
                    Portal access
                  </T>
                  <T muted style={{ fontSize: 11 }}>
                    Choose who can access your workspace.
                  </T>
                </View>
                {row(
                  "candidatePortal",
                  "Candidate portal",
                  "Allow candidates to view their own verification and upload documents.",
                  "person-outline",
                )}
                {row(
                  "clientPortal",
                  "Client portal",
                  "Allow client users to view and manage their organization’s cases.",
                  "business-outline",
                )}
                {row(
                  "maintenance",
                  "Maintenance mode",
                  "Temporarily lock Client and Candidate portals. Administrators retain access to settings.",
                  "construct-outline",
                  true,
                )}
              </Panel>
              <Panel>
                <View
                  style={{
                    padding: 23,
                    borderBottomWidth: 1,
                    borderColor: p.border,
                    gap: 5,
                  }}
                >
                  <T weight="semibold" style={{ fontSize: 15 }}>
                    Workflow permissions
                  </T>
                  <T muted style={{ fontSize: 11 }}>
                    These controls apply throughout the application.
                  </T>
                </View>
                {row(
                  "uploads",
                  "Document uploads",
                  "Allow candidates and administrators to add supporting documents.",
                  "cloud-upload-outline",
                )}
                {row(
                  "newCases",
                  "New verifications",
                  "Allow administrators and clients to create new verification cases.",
                  "add-circle-outline",
                )}
                {row(
                  "exports",
                  "Report exports",
                  "Allow CSV downloads of verification summaries and activity logs.",
                  "download-outline",
                )}
                {row(
                  "requireConsent",
                  "Require upload consent",
                  "Ask for explicit consent before a candidate’s first upload.",
                  "shield-checkmark-outline",
                )}
                <View style={{ padding: 24, gap: 13 }}>
                  <T weight="medium">Maximum file size</T>
                  <Chips
                    items={["5 MB", "10 MB", "20 MB"]}
                    value={`${draft.maxFileSize} MB`}
                    onChange={(s) => update("maxFileSize", parseInt(s))}
                  />
                  <T muted style={{ fontSize: 11 }}>
                    PDF, JPG, and PNG files are accepted. The limit is checked
                    before a file is saved.
                  </T>
                </View>
              </Panel>
            </View>
            <View style={{ flex: 1, gap: 20 }}>
              <Panel style={{ padding: 23, gap: 15 }}>
                <Icon
                  name="shield-checkmark-outline"
                  size={29}
                  color={p.green}
                />
                <T weight="heading" style={{ fontSize: 18, lineHeight: 26 }}>
                  The right access.{"\n"}The right people.
                </T>
                <T muted style={{ fontSize: 12, lineHeight: 21 }}>
                  A clearly defined workspace means every person sees just what
                  they need.
                </T>
                {[
                  {
                    role: "Admin",
                    text: "All cases, documents, and controls",
                    color: p.green,
                  },
                  {
                    role: "Client",
                    text: "Organization cases and read-only documents",
                    color: p.blue,
                  },
                  {
                    role: "Candidate",
                    text: "Own checklist and verification only",
                    color: p.purple,
                  },
                ].map((x) => (
                  <View
                    key={x.role}
                    style={{
                      gap: 6,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderColor: p.border,
                    }}
                  >
                    <Badge label={x.role} color={x.color} dot={false} />
                    <T muted style={{ fontSize: 11 }}>
                      {x.text}
                    </T>
                  </View>
                ))}
              </Panel>
              <View
                style={{
                  padding: 18,
                  borderWidth: 1,
                  borderColor: p.amber + "30",
                  borderRadius: 9,
                  backgroundColor: p.amber + "07",
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Icon
                    name="information-circle-outline"
                    size={17}
                    color={p.amber}
                  />
                  <T weight="medium" style={{ color: p.amber, fontSize: 12 }}>
                    About this demo
                  </T>
                </View>
                <T muted style={{ fontSize: 11, lineHeight: 19 }}>
                  Role switching is for previewing workflows, not
                  authentication. Production access requires server-side
                  authorization, private encrypted storage, and an approved
                  data-retention policy.
                </T>
              </View>
            </View>
          </View>
        </>
      ) : admin && tab === "General" ? (
        <Panel style={{ padding: 25, gap: 23, maxWidth: 760 }}>
          <T weight="semibold" style={{ fontSize: 16 }}>
            Workspace details
          </T>
          <Field
            label="Workspace name"
            value={draft.workspace}
            onChangeText={(v) => update("workspace", v)}
            accessibilityLabel="Workspace name"
          />
          <View style={{ gap: 7 }}>
            <T muted style={{ fontSize: 11 }}>
              WORKSPACE ID
            </T>
            <T>BGV-ACME-2026</T>
          </View>
          <View style={{ gap: 7 }}>
            <T muted style={{ fontSize: 11 }}>
              DOCUMENT CHECKLIST
            </T>
            <T>Reference-based checklist · 14 original verification types</T>
            <T muted style={{ fontSize: 11 }}>
              Requirements are editable from Document checklist. Estimated
              processing times are illustrative, not service guarantees.
            </T>
          </View>
        </Panel>
      ) : admin && tab === "Notifications" ? (
        <Panel>
          <View
            style={{ padding: 23, borderBottomWidth: 1, borderColor: p.border }}
          >
            <T weight="semibold">Stay in the loop</T>
          </View>
          {row(
            "notifications",
            "In-app notifications",
            "Show workspace activity in the notification center. No push or email messages are sent.",
            "notifications-outline",
          )}
        </Panel>
      ) : (
        <Panel style={{ padding: 25, gap: 23, maxWidth: 850 }}>
          <View style={{ gap: 6 }}>
            <T weight="semibold" style={{ fontSize: 16 }}>
              Appearance
            </T>
            <T muted style={{ fontSize: 12 }}>
              Choose the workspace that feels right to you.
            </T>
          </View>
          <View style={{ flexDirection: "row", gap: 13 }}>
            {(["Dark", "Light", "System"] as const).map((theme) => (
              <View key={theme} style={{ flex: 1, gap: 12 }}>
                <View
                  style={{
                    height: 115,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: draft.theme === theme ? p.green : p.border,
                    backgroundColor: theme === "Light" ? "#f4f7f9" : "#0b1118",
                    overflow: "hidden",
                    padding: 12,
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: "23%",
                      backgroundColor:
                        theme === "Light" ? "#e0e7eb" : "#1e2c36",
                      borderRadius: 3,
                    }}
                  />
                  <View style={{ flex: 1, gap: 8 }}>
                    <View
                      style={{
                        height: 10,
                        width: "65%",
                        backgroundColor:
                          theme === "Light" ? "#c4d2dc" : "#3b505e",
                        borderRadius: 3,
                      }}
                    />
                    <View
                      style={{
                        height: 32,
                        backgroundColor:
                          theme === "Light" ? "#d9e8e2" : "#1b3b32",
                        borderRadius: 3,
                      }}
                    />
                    <View
                      style={{
                        height: 20,
                        backgroundColor:
                          theme === "Light" ? "#e0e7eb" : "#1e2c36",
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
                <Button
                  label={theme}
                  variant={draft.theme === theme ? "primary" : "secondary"}
                  onPress={() => update("theme", theme)}
                />
              </View>
            ))}
          </View>
          {!admin &&
            row(
              "notifications",
              "In-app notifications",
              "See recent activity from your portal in the notification center.",
              "notifications-outline",
            )}
        </Panel>
      )}
      {dirty && (
        <View
          style={{
            padding: 17,
            marginTop: 22,
            borderWidth: 1,
            borderColor: p.green + "40",
            borderRadius: 8,
            backgroundColor: p.greenBg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <T style={{ color: p.green, fontSize: 12 }}>
            You have unsaved changes.
          </T>
          <Button
            label="Discard changes"
            small
            variant="secondary"
            onPress={() => setDraft(settings)}
          />
        </View>
      )}
    </Page>
  );
}

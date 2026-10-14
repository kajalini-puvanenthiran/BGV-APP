import React, { useState } from "react";
import { View, Switch, Pressable, useWindowDimensions } from "react-native";
import { useStore } from "../lib/store";
import {
  Page,
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Badge,
  Search,
  Dialog,
  Field,
  Empty,
  IconButton,
} from "../components/ui";
import { CandidateTable } from "../components/CandidateTable";
import { openCase } from "../lib/navigation";
import { removeDocument } from "../lib/files";

export default function Clients() {
  const {
    palette: p,
    role,
    candidates,
    setCandidates,
    organizations,
    setOrganizations,
    checks,
    clientChecklists,
    setClientChecklists,
    uploads,
    setUploads,
    selectedClient,
    setSelectedClient,
    log,
    toast,
  } = useStore();
  const { width } = useWindowDimensions();
  // search text state
  const [search, setSearch] = useState("");
  const [create, setCreate] = useState(false);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "completed">("all");
  // edit organization state
  const [editOrg, setEditOrg] = useState<string | null>(null);
  const [editOrgName, setEditOrgName] = useState("");
  const [editOrgError, setEditOrgError] = useState("");
  const [deleteOrg, setDeleteOrg] = useState<string | null>(null);
  // edit client state
  const [editClient, setEditClient] = useState<string | null>(null);
  const [editChecks, setEditChecks] = useState<string[]>([]);
  // open checklist editor
  const openChecklistEditor = (company: string) => {
    const current =
      clientChecklists[company] ??
      checks.filter((c) => c.enabled).map((c) => c.id);
    setEditChecks(current);
    setEditClient(company);
  };
  const enabledChecks = checks.filter((c) => c.enabled);

  const toggleEditCheck = (id: string) =>
    setEditChecks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  if (role !== "Admin")
    return (
      <Empty
        icon="lock-closed-outline"
        title="Administrator access only"
        description="Client management is available in the Admin portal."
      />
    );
  return (
    <Page>
      <PageHeading
        eyebrow="BETTER HIRING, TOGETHER"
        title="Your clients. One connected workspace."
        description="A dedicated view of every organization you support."
        actions={
          <Button
            label="Add client"
            icon="add"
            onPress={() => setCreate(true)}
          />
        }
      />
      <View style={{ marginBottom: 22 }}>
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search client organizations..."
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
        {organizations
          .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
          .map((company, i) => {
            const cases = candidates.filter((c) => c.company === company);
            const complete = cases.filter((c) => c.status === "Completed");
            const color = [p.green, p.purple, p.blue, p.amber][i % 4];
            const assignedCount =
              clientChecklists[company]?.length ?? enabledChecks.length;
            return (
              <Panel
                key={company}
                style={{
                  width: width < 650 ? "100%" : width < 1200 ? "48%" : "31.8%",
                  padding: 23,
                  gap: 19,
                }}
              >
                {/* Header: icon + badge + edit/delete icon buttons only */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      height: 46,
                      width: 46,
                      borderRadius: 10,
                      backgroundColor: color + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="business-outline" color={color} size={24} />
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Badge label="Active" />
                    <IconButton
                      name="create-outline"
                      size={16}
                      label={`Edit ${company} name`}
                      onPress={() => {
                        setEditOrg(company);
                        setEditOrgName(company);
                        setEditOrgError("");
                      }}
                    />
                    <IconButton
                      name="trash-outline"
                      size={16}
                      label={`Delete ${company}`}
                      onPress={() => setDeleteOrg(company)}
                    />
                  </View>
                </View>

                {/* Company name + subtitle */}
                <View style={{ gap: 5 }}>
                  <T weight="semibold" style={{ fontSize: 16 }}>
                    {company}
                  </T>
                  <T muted style={{ fontSize: 11 }}>
                    Client organization · BGV workspace
                  </T>
                </View>

                {/* Clickable stats row */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 25,
                    paddingVertical: 15,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: p.border,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View all ${cases.length} verifications for ${company}`}
                    onPress={() => {
                      setSelectedFilter("all");
                      setSelected(company);
                    }}
                    style={({ pressed }: any) => ({
                      gap: 5,
                      opacity: pressed ? 0.6 : 1,
                      borderRadius: 6,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    })}
                  >
                    <T weight="heading" style={{ fontSize: 25, lineHeight: 30 }}>
                      {cases.length}
                    </T>
                    <T muted style={{ fontSize: 10 }}>
                      Verifications
                    </T>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${complete.length} completed verifications for ${company}`}
                    onPress={() => {
                      setSelectedFilter("completed");
                      setSelected(company);
                    }}
                    style={({ pressed }: any) => ({
                      gap: 5,
                      opacity: pressed ? 0.6 : 1,
                      borderRadius: 6,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    })}
                  >
                    <T weight="heading" style={{ fontSize: 25, lineHeight: 30, color: p.green }}>
                      {complete.length}
                    </T>
                    <T muted style={{ fontSize: 10 }}>
                      Completed
                    </T>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit checklist (${assignedCount} checks) for ${company}`}
                    onPress={() => openChecklistEditor(company)}
                    style={({ pressed }: any) => ({
                      gap: 5,
                      opacity: pressed ? 0.6 : 1,
                      borderRadius: 6,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    })}
                  >
                    <T weight="heading" style={{ fontSize: 25, lineHeight: 30, color: p.blue }}>
                      {assignedCount}
                    </T>
                    <T muted style={{ fontSize: 10 }}>
                      Checks
                    </T>
                  </Pressable>
                </View>

                {/* Action buttons - Edit name / Delete removed, use icons above */}
                <View style={{ gap: 8 }}>
                  <Button
                    label={`View ${company.split(" ")[0]} candidates`}
                    variant="secondary"
                    icon="arrow-forward-outline"
                    onPress={() => {
                      setSelectedFilter("all");
                      setSelected(company);
                    }}
                  />
                  <Button
                    label="Edit checklist"
                    variant="secondary"
                    icon="list-outline"
                    onPress={() => openChecklistEditor(company)}
                  />
                </View>
              </Panel>
            );
          })}
      </View>
      {!organizations.some((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
      ) && (
          <Empty
            title="No clients found"
            description="Try a different organization name."
          />
        )}

      {/* Add client dialog */}
      <Dialog
        visible={create}
        onClose={() => setCreate(false)}
        title="Add a client organization"
        description="Organize new verification cases under a dedicated client."
      >
        <Field
          label="Organization name"
          accessibilityLabel="Organization name"
          placeholder="e.g. Northstar Technologies"
          value={name}
          onChangeText={setName}
        />
        <T muted style={{ fontSize: 11 }}>
          This creates a local organization, not a login account. You can assign
          new cases to it from New verification.
        </T>
        <Button
          label="Create organization"
          disabled={!name.trim()}
          onPress={() => {
            if (
              organizations.some(
                (c) => c.toLowerCase() === name.trim().toLowerCase(),
              )
            ) {
              toast("An organization with this name already exists.");
              return;
            }
            setOrganizations((cs) => [...cs, name.trim()]);
            setClientChecklists((prev) => ({
              ...prev,
              [name.trim()]: enabledChecks.map((c) => c.id),
            }));
            log("Client organization added", name.trim(), "business-outline");
            setName("");
            setCreate(false);
            toast("Client organization created.");
          }}
        />
      </Dialog>

      {/* Candidate overview dialog - all or completed filter */}
      <Dialog
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected || "Client"}
        description={
          selectedFilter === "completed"
            ? "Completed verifications for this organization."
            : "All candidates belonging to this organization."
        }
        width={800}
      >
        <CandidateTable
          items={(selectedFilter === "completed"
            ? candidates.filter(
              (c) => c.company === selected && c.status === "Completed",
            )
            : candidates.filter((c) => c.company === selected)
          ).slice(0, 12)}
          onSelect={(id) => {
            setSelected(null);
            openCase(id);
          }}
        />
        <Button
          label="Close overview"
          variant="secondary"
          onPress={() => setSelected(null)}
        />
      </Dialog>

      {/* Per-client checklist editor */}
      <Dialog
        visible={!!editClient}
        onClose={() => setEditClient(null)}
        title={`${editClient ?? ""} — Checklist`}
        description="Choose which checks are included in new cases for this client. This becomes the default when creating a new verification."
        width={620}
      >
        <View
          style={{
            backgroundColor: p.greenBg,
            padding: 12,
            borderRadius: 7,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Icon name="shield-checkmark-outline" color={p.green} />
          <T style={{ color: p.green, fontSize: 11, flex: 1 }}>
            {editChecks.length} of {enabledChecks.length} checks selected
          </T>
        </View>

        <View
          style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}
        >
          <Button
            label="Select all"
            variant="ghost"
            small
            onPress={() => setEditChecks(enabledChecks.map((c) => c.id))}
          />
          <Button
            label="Clear all"
            variant="ghost"
            small
            onPress={() => setEditChecks([])}
          />
        </View>

        <View style={{ gap: 8 }}>
          {enabledChecks.map((c) => {
            const on = editChecks.includes(c.id);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`${on ? "Remove" : "Add"} ${c.title} for ${editClient}`}
                onPress={() => toggleEditCheck(c.id)}
                style={({ pressed }: any) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: on ? p.green + "50" : p.border,
                  backgroundColor: on ? p.greenBg : p.raised,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      backgroundColor: c.color + "18",
                    }}
                  >
                    <Icon name={c.icon} color={c.color} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T
                      weight="medium"
                      style={{ fontSize: 12, color: on ? p.text : p.muted }}
                    >
                      {c.title}
                    </T>
                    <T muted style={{ fontSize: 10 }}>
                      {c.category} · {c.days} days
                    </T>
                  </View>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {c.required && (
                    <Badge label="Required" color={p.muted} dot={false} />
                  )}
                  <Switch
                    value={on}
                    onValueChange={() => toggleEditCheck(c.id)}
                    trackColor={{ false: p.border, true: p.green }}
                    accessibilityLabel={`Toggle ${c.title}`}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => setEditClient(null)}
          />
          <Button
            label="Save checklist"
            icon="checkmark-outline"
            onPress={() => {
              if (editClient) {
                setClientChecklists((prev) => ({
                  ...prev,
                  [editClient]: editChecks,
                }));
                log(
                  "Client checklist updated",
                  editClient,
                  "list-outline",
                  "#77a6ef",
                );
                toast(`Checklist saved for ${editClient}.`);
              }
              setEditClient(null);
            }}
          />
        </View>
      </Dialog>

      {/* Edit client organization dialog */}
      <Dialog
        visible={!!editOrg}
        onClose={() => {
          setEditOrg(null);
          setEditOrgError("");
        }}
        title="Edit client organization"
        description={`Update organization name for "${editOrg}"`}
      >
        <Field
          label="Organization name"
          accessibilityLabel="Edit organization name"
          placeholder="e.g. Acme Corporation"
          value={editOrgName}
          onChangeText={setEditOrgName}
        />
        <T muted style={{ fontSize: 11 }}>
          Updating this organization name will automatically rename it across all associated candidate verification cases and checklist configurations.
        </T>
        {!!editOrgError && (
          <T style={{ color: p.danger, fontSize: 12 }}>{editOrgError}</T>
        )}
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => {
              setEditOrg(null);
              setEditOrgError("");
            }}
          />
          <Button
            label="Save changes"
            icon="checkmark-outline"
            onPress={() => {
              const trimmed = editOrgName.trim();
              if (!trimmed) {
                setEditOrgError("Organization name cannot be empty.");
                return;
              }
              if (!editOrg) return;
              if (
                trimmed.toLowerCase() !== editOrg.toLowerCase() &&
                organizations.some((c) => c.toLowerCase() === trimmed.toLowerCase())
              ) {
                setEditOrgError("An organization with this name already exists.");
                return;
              }
              if (trimmed !== editOrg) {
                const oldName = editOrg;
                setOrganizations((cs) => cs.map((c) => (c === oldName ? trimmed : c)));
                setCandidates((cs) =>
                  cs.map((c) => (c.company === oldName ? { ...c, company: trimmed } : c)),
                );
                setClientChecklists((prev) => {
                  const next = { ...prev };
                  if (next[oldName]) {
                    next[trimmed] = next[oldName];
                    delete next[oldName];
                  }
                  return next;
                });
                if (selectedClient === oldName) {
                  setSelectedClient(trimmed);
                }
                log("Client updated", `${oldName} renamed to ${trimmed}`, "business-outline");
                toast(`Client organization renamed to "${trimmed}".`);
              }
              setEditOrg(null);
              setEditOrgError("");
            }}
          />
        </View>
      </Dialog>

      {/* Delete client organization dialog */}
      <Dialog
        visible={!!deleteOrg}
        onClose={() => setDeleteOrg(null)}
        title="Delete client organization?"
        description={deleteOrg || ""}
      >
        <T muted style={{ fontSize: 13, lineHeight: 20 }}>
          Are you sure you want to delete <T weight="semibold">{deleteOrg}</T>?
          {(() => {
            const count = candidates.filter((c) => c.company === deleteOrg).length;
            return count > 0
              ? ` All ${count} associated candidate verification case(s) and documents will also be permanently removed.`
              : " This organization has no active verification cases.";
          })()}
        </T>
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
          <Button
            label="Cancel"
            variant="secondary"
            onPress={() => setDeleteOrg(null)}
          />
          <Button
            label="Delete organization"
            variant="danger"
            icon="trash-outline"
            onPress={async () => {
              if (!deleteOrg) return;
              const target = deleteOrg;
              const toDelete = candidates.filter((c) => c.company === target);
              for (const c of toDelete) {
                const cUploads = uploads.filter((u) => u.candidateId === c.id);
                for (const u of cUploads) {
                  try {
                    await removeDocument(u.id);
                  } catch { }
                }
              }
              setOrganizations((cs) => cs.filter((c) => c !== target));
              setCandidates((cs) => cs.filter((c) => c.company !== target));
              setUploads((us) => us.filter((u) => !toDelete.some((c) => c.id === u.candidateId)));
              setClientChecklists((prev) => {
                const next = { ...prev };
                delete next[target];
                return next;
              });
              if (selectedClient === target) {
                const remaining = organizations.filter((c) => c !== target);
                setSelectedClient(remaining[0] || "");
              }
              log("Client deleted", target, "trash-outline", p.danger);
              toast(`Client organization "${target}" was deleted.`);
              setDeleteOrg(null);
            }}
          />
        </View>
      </Dialog>
    </Page>
  );
}

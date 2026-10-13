import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { Candidate, CaseStatus } from "../lib/data";
import { useStore } from "../lib/store";
import { Dialog, Field, Button, T, Chips, Icon } from "./ui";

/* ─── Searchable Client Dropdown ─────────────────────────────────────────── */
export function ClientDropdown({
  value,
  organizations,
  onSelect,
  onCreateNew,
}: {
  value: string;
  organizations: string[];
  onSelect: (org: string) => void;
  onCreateNew: (name: string) => void;
}) {
  const { palette: p } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const filtered = organizations.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = (org: string) => {
    onSelect(org);
    setOpen(false);
    setSearch("");
  };

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setCreateError("Client name cannot be empty.");
      return;
    }
    if (organizations.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
      setCreateError("A client with this name already exists.");
      return;
    }
    onCreateNew(trimmed);
    onSelect(trimmed);
    setCreating(false);
    setNewName("");
    setCreateError("");
    setOpen(false);
    setSearch("");
  };

  return (
    <View style={{ gap: 6 }}>
      <T weight="medium" style={{ fontSize: 11 }}>
        Client organization
      </T>

      {/* Trigger button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select client organization"
        onPress={() => {
          setOpen(true);
          setSearch("");
          setCreating(false);
          setNewName("");
          setCreateError("");
        }}
        style={({ pressed }: any) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: p.green,
          backgroundColor: p.raised,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name="business-outline" size={15} color={p.green} />
          <T weight="semibold" style={{ fontSize: 13, color: p.green }}>
            {value || "Select a client…"}
          </T>
        </View>
        <Icon name="chevron-down-outline" size={16} color={p.muted} />
      </Pressable>

      {/* Dropdown modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "#00000055", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 14,
              backgroundColor: p.panel,
              borderWidth: 1,
              borderColor: p.border,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderBottomWidth: 1,
                borderColor: p.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="business-outline" size={16} color={p.green} />
                <T weight="semibold" style={{ fontSize: 14 }}>
                  Select Client
                </T>
              </View>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close dropdown">
                <Icon name="close-outline" size={20} color={p.muted} />
              </Pressable>
            </View>

            {/* Search box */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: p.border,
                backgroundColor: p.raised,
              }}
            >
              <Icon name="search-outline" size={15} color={p.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search clients…"
                placeholderTextColor={p.subtle}
                style={{ flex: 1, fontSize: 13, color: p.text, outlineStyle: "none" } as any}
                autoFocus
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Icon name="close-circle-outline" size={16} color={p.muted} />
                </Pressable>
              )}
            </View>

            {/* Client list */}
            <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
              {filtered.length === 0 && !creating && (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <T muted style={{ fontSize: 12 }}>No clients match "{search}"</T>
                </View>
              )}
              {filtered.map((org) => {
                const isSelected = org === value;
                return (
                  <Pressable
                    key={org}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${org}`}
                    onPress={() => handleSelect(org)}
                    style={({ pressed }: any) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: isSelected
                        ? p.green + "18"
                        : pressed
                          ? p.raised
                          : "transparent",
                      borderBottomWidth: 1,
                      borderColor: p.border + "60",
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: isSelected ? p.green + "25" : p.raised,
                          borderWidth: 1,
                          borderColor: isSelected ? p.green : p.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          name="business-outline"
                          size={13}
                          color={isSelected ? p.green : p.muted}
                        />
                      </View>
                      <T
                        weight={isSelected ? "semibold" : "regular"}
                        style={{ fontSize: 13, color: isSelected ? p.green : p.text }}
                      >
                        {org}
                      </T>
                    </View>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={18} color={p.green} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Create new client section */}
            <View
              style={{
                borderTopWidth: 1,
                borderColor: p.border,
                padding: 14,
                gap: 10,
              }}
            >
              {!creating ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create new client"
                  onPress={() => setCreating(true)}
                  style={({ pressed }: any) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: p.green + "70",
                    backgroundColor: p.greenBg + "80",
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Icon name="add-circle-outline" size={16} color={p.green} />
                  <T style={{ fontSize: 12, color: p.green }}>
                    Create new client organization
                  </T>
                </Pressable>
              ) : (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="business-outline" size={14} color={p.green} />
                    <T weight="medium" style={{ fontSize: 12, color: p.green }}>
                      New client name
                    </T>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      borderWidth: 1.5,
                      borderColor: p.green,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: p.raised,
                    }}
                  >
                    <TextInput
                      value={newName}
                      onChangeText={(v) => { setNewName(v); setCreateError(""); }}
                      placeholder="e.g. Acme Technologies Ltd."
                      placeholderTextColor={p.subtle}
                      style={{ flex: 1, fontSize: 13, color: p.text, outlineStyle: "none" } as any}
                      autoFocus
                      onSubmitEditing={handleCreate}
                    />
                  </View>
                  {!!createError && (
                    <T style={{ fontSize: 11, color: p.danger }}>{createError}</T>
                  )}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button
                      label="Cancel"
                      variant="ghost"
                      small
                      onPress={() => { setCreating(false); setNewName(""); setCreateError(""); }}
                    />
                    <Button
                      label="Add & Select"
                      icon="checkmark-outline"
                      small
                      onPress={handleCreate}
                    />
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─── Main Edit Dialog ───────────────────────────────────────────────────── */
export function EditCandidateDialog({
  candidate,
  visible,
  onClose,
  onSaved,
}: {
  candidate: Candidate | null;
  visible: boolean;
  onClose: () => void;
  onSaved?: (updated: Candidate) => void;
}) {
  const {
    palette: p,
    organizations,
    setOrganizations,
    setCandidates,
    checks,
    log,
    toast,
  } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<CaseStatus>("Pending");
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"info" | "checks">("info");

  useEffect(() => {
    if (candidate && visible) {
      setName(candidate.name);
      setEmail(candidate.email);
      setPosition(candidate.position);
      setCompany(candidate.company);
      setStatus(candidate.status);
      setSelectedChecks(candidate.checks || []);
      setError("");
      setTab("info");
    }
  }, [candidate, visible]);

  if (!candidate) return null;

  const toggleCheck = (id: string) => {
    setSelectedChecks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Candidate name cannot be empty.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!company) {
      setError("Please select a client organization.");
      return;
    }

    const updated: Candidate = {
      ...candidate,
      name: name.trim(),
      email: email.trim(),
      position: position.trim() || "Not specified",
      company,
      status,
      checks: selectedChecks.length > 0 ? selectedChecks : candidate.checks,
    };

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? updated : c)),
    );

    log("Candidate updated", `${updated.name} · ${updated.company}`, "person-outline");
    toast(`Candidate "${updated.name}" updated successfully.`);
    onSaved?.(updated);
    onClose();
  };

  const handleCreateNewOrg = (orgName: string) => {
    setOrganizations((prev) =>
      prev.includes(orgName) ? prev : [...prev, orgName],
    );
    log("Client added", orgName, "business-outline");
    toast(`Client "${orgName}" created and selected.`);
  };

  const enabledChecks = checks.filter((c) => c.enabled);

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Edit candidate verification"
      description={`Update case details for ${candidate.id}`}
    >
      {/* Tab switcher */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {(["info", "checks"] as const).map((t) => (
          <Pressable
            key={t}
            accessibilityRole="button"
            accessibilityLabel={t === "info" ? "General details tab" : "Checks tab"}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: "center",
              borderRadius: 6,
              backgroundColor: tab === t ? p.green + "25" : p.raised,
              borderWidth: 1,
              borderColor: tab === t ? p.green : p.border,
            }}
          >
            <T
              weight={tab === t ? "semibold" : "regular"}
              style={{ fontSize: 12, color: tab === t ? p.green : p.muted }}
            >
              {t === "info" ? "General details" : `Assigned checks (${selectedChecks.length})`}
            </T>
          </Pressable>
        ))}
      </View>

      {tab === "info" ? (
        <View style={{ gap: 14 }}>
          <Field
            label="Candidate name"
            accessibilityLabel="Candidate name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Eleanor Vance"
          />
          <Field
            label="Email address"
            accessibilityLabel="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. eleanor@example.com"
          />
          <Field
            label="Position applied for"
            accessibilityLabel="Position applied for"
            value={position}
            onChangeText={setPosition}
            placeholder="e.g. Senior Security Engineer"
          />

          {/* Client dropdown with create new */}
          <ClientDropdown
            value={company}
            organizations={organizations}
            onSelect={setCompany}
            onCreateNew={handleCreateNewOrg}
          />

          <View style={{ gap: 6 }}>
            <T weight="medium" style={{ fontSize: 11 }}>
              Verification status
            </T>
            <Chips
              items={["Pending", "In progress", "Completed", "Needs attention"]}
              value={status}
              onChange={(val) => setStatus(val as CaseStatus)}
            />
          </View>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 260 }}>
          <View style={{ gap: 8, paddingVertical: 4 }}>
            <T muted style={{ fontSize: 11 }}>
              Toggle the verification checks that apply to this candidate:
            </T>
            {enabledChecks.map((c) => {
              const active = selectedChecks.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${c.title}`}
                  onPress={() => toggleCheck(c.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: active ? p.green + "12" : p.raised,
                    borderWidth: 1,
                    borderColor: active ? p.green + "40" : p.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <Icon name={c.icon} size={18} color={active ? p.green : p.muted} />
                    <View style={{ flex: 1 }}>
                      <T weight="medium" style={{ fontSize: 12 }}>
                        {c.title}
                      </T>
                      <T muted style={{ fontSize: 10 }}>
                        {c.category} · {c.documents.length} doc requirement(s)
                      </T>
                    </View>
                  </View>
                  <Switch
                    accessibilityLabel={`Switch ${c.title}`}
                    value={active}
                    onValueChange={() => toggleCheck(c.id)}
                    trackColor={{ false: p.border, true: p.green }}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {!!error && (
        <T style={{ color: p.danger, fontSize: 12, marginTop: 10 }}>
          {error}
        </T>
      )}

      <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
        <Button label="Cancel" variant="secondary" onPress={onClose} />
        <Button label="Save candidate" icon="checkmark-outline" onPress={handleSave} />
      </View>
    </Dialog>
  );
}

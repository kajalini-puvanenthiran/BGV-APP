import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Switch } from "react-native";
import { Candidate, CaseStatus } from "../lib/data";
import { useStore } from "../lib/store";
import { Dialog, Field, Button, T, Chips, Icon } from "./ui";

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

  const enabledChecks = checks.filter((c) => c.enabled);

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Edit candidate verification"
      description={`Update case details for ${candidate.id}`}
    >
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="General details tab"
          onPress={() => setTab("info")}
          style={{
            flex: 1,
            paddingVertical: 8,
            alignItems: "center",
            borderRadius: 6,
            backgroundColor: tab === "info" ? p.green + "25" : p.raised,
            borderWidth: 1,
            borderColor: tab === "info" ? p.green : p.border,
          }}
        >
          <T weight={tab === "info" ? "semibold" : "regular"} style={{ fontSize: 12, color: tab === "info" ? p.green : p.muted }}>
            General details
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Checks tab"
          onPress={() => setTab("checks")}
          style={{
            flex: 1,
            paddingVertical: 8,
            alignItems: "center",
            borderRadius: 6,
            backgroundColor: tab === "checks" ? p.green + "25" : p.raised,
            borderWidth: 1,
            borderColor: tab === "checks" ? p.green : p.border,
          }}
        >
          <T weight={tab === "checks" ? "semibold" : "regular"} style={{ fontSize: 12, color: tab === "checks" ? p.green : p.muted }}>
            Assigned checks ({selectedChecks.length})
          </T>
        </Pressable>
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

          <View style={{ gap: 6 }}>
            <T weight="medium" style={{ fontSize: 11 }}>
              Client organization
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 7, paddingVertical: 2 }}>
                {organizations.map((org) => {
                  const isSelected = org === company;
                  return (
                    <Pressable
                      key={org}
                      accessibilityRole="button"
                      accessibilityLabel={`Select client ${org}`}
                      onPress={() => setCompany(org)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: isSelected ? p.green + "25" : p.raised,
                        borderWidth: 1,
                        borderColor: isSelected ? p.green : p.border,
                      }}
                    >
                      <T style={{ fontSize: 11, color: isSelected ? p.green : p.text }}>
                        {org}
                      </T>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

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

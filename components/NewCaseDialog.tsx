import React, { useState, useEffect } from "react";
import { View, Switch, Pressable } from "react-native";
import { useStore } from "../lib/store";
import { companies } from "../lib/data";
import { Dialog, T, Field, Chips, Button, Icon, Badge } from "./ui";
import { ClientDropdown } from "./EditCandidateDialog";

export function NewCaseDialog({
  visible,
  onClose,
  presetCompany,
}: {
  visible: boolean;
  onClose: () => void;
  presetCompany?: string;
}) {
  const {
    palette: p,
    role,
    settings,
    setCandidates,
    checks,
    log,
    toast,
    organizations,
    setOrganizations,
    setClientChecklists,
    getClientCheckIds,
  } = useStore();
  // declare state variables for new case dialog 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState(
    role === "Client" ? "Acme Corporation" : organizations[0] ?? companies[0],
  );
  const [error, setError] = useState("");
  const [step, setStep] = useState<"details" | "checklist">("details");
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  // handle visible state 
  useEffect(() => {
    if (visible) {
      const initial =
        presetCompany ??
        (role === "Client" ? "Acme Corporation" : organizations[0] ?? companies[0]);
      setCompany(initial);
      setSelectedChecks(getClientCheckIds(initial));
      setStep("details");
      setError("");
      setName("");
      setEmail("");
      setPosition("");
    }
  }, [visible]);

  useEffect(() => {
    setSelectedChecks(getClientCheckIds(company));
  }, [company]);

  const enabledChecks = checks.filter((c) => c.enabled);

  const toggleCheck = (id: string) =>
    setSelectedChecks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const goToChecklist = () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the candidate's full name and a valid email address.");
      return;
    }
    setError("");
    setStep("checklist");
  };
  // create case logic
  const create = () => {
    if (role === "Candidate" || !settings.newCases || settings.maintenance) {
      setError("New verifications are restricted by your administrator.");
      return;
    }
    if (selectedChecks.length === 0) {
      setError("Select atleast a one checklist item for this case.");
      return;
    }
    const id = "BGV-" + Date.now().toString().slice(-8);
    const eff = role === "Client" ? "Acme Corporation" : company;
    setCandidates((cs) => [
      {
        id,
        name: name.trim(),
        email: email.trim(),
        position: position.trim() || "Not specified",
        company: eff,
        status: "Pending",
        progress: 0,
        created: new Date().toISOString().slice(0, 10),
        color: "#7e9ab8",
        checks: selectedChecks,
      },
      ...cs,
    ]);
    log("New verification created", name.trim() + " · " + eff, "person-add-outline");
    toast("Verification created. The candidate is ready for document collection.");
    setStep("details");
    onClose();
  };

  /* ── Step 1: details ────────────────────────────────────────────────────── */
  if (step === "details") {
    return (
      <Dialog
        visible={visible}
        onClose={onClose}
        title="New verification"
        description="Start a confident hiring decision with a new candidate."
      >
        <View
          style={{
            backgroundColor: p.greenBg,
            padding: 13,
            borderRadius: 7,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Icon name="shield-checkmark-outline" color={p.green} />
          <T style={{ color: p.green, fontSize: 11, flex: 1 }}>
            {selectedChecks.length} checks pre-selected from the client
            checklist. Review and customise on the next step.
          </T>
        </View>
        <Field
          label="Full name"
          placeholder="e.g. Jamie Smith"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Candidate full name"
        />
        <Field
          label="Email address"
          placeholder="jamie@company.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Candidate email"
        />
        <Field
          label="Job title"
          placeholder="e.g. Software Engineer"
          value={position}
          onChangeText={setPosition}
        />
        {role === "Admin" && (
          <View style={{ gap: 8 }}>
            {presetCompany ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 7,
                  borderWidth: 1,
                  borderColor: p.border,
                  backgroundColor: p.raised,
                }}
              >
                <Icon name="business-outline" color={p.muted} size={16} />
                <T weight="semibold" style={{ fontSize: 12, flex: 1 }}>
                  {presetCompany}
                </T>
                <Icon name="lock-closed-outline" color={p.subtle} size={13} />
              </View>
            ) : (
              <ClientDropdown
                value={company}
                organizations={organizations}
                onSelect={(org) => {
                  setCompany(org);
                  setSelectedChecks(getClientCheckIds(org));
                }}
                onCreateNew={(orgName) => {
                  setOrganizations((prev) =>
                    prev.includes(orgName) ? prev : [...prev, orgName],
                  );
                  log("Client added", orgName, "business-outline");
                  toast(`Client "${orgName}" created and selected.`);
                }}
              />
            )}
          </View>
        )}
        {!!error && <T style={{ color: p.danger, fontSize: 12 }}>{error}</T>}
        <T muted style={{ fontSize: 10 }}>
          Local demo: creating a case does not send an email invitation or
          perform an external background check.
        </T>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button
            label="Next: Checklist"
            icon="chevron-forward-outline"
            onPress={goToChecklist}
          />
        </View>
      </Dialog>
    );
  }

  /* ── Step 2: per-client checklist selection ─────────────────────────────── */
  const eff = role === "Client" ? "Acme Corporation" : company;
  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Assign checks"
      description={"Choose checks for " + name.trim() + " at " + eff + "."}
      width={600}
    >
      <View
        style={{
          backgroundColor: p.greenBg,
          padding: 13,
          borderRadius: 7,
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Icon name="list-outline" color={p.green} />
        <T style={{ color: p.green, fontSize: 11, flex: 1 }}>
          {selectedChecks.length} of {enabledChecks.length} selected. Only
          selected checks appear in the candidate portal.
        </T>
      </View>

      <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
        <Button
          label="Select all"
          variant="ghost"
          small
          onPress={() => setSelectedChecks(enabledChecks.map((c) => c.id))}
        />
        <Button
          label="Clear all"
          variant="ghost"
          small
          onPress={() => setSelectedChecks([])}
        />
      </View>

      <View style={{ gap: 8 }}>
        {enabledChecks.map((c) => {
          const on = selectedChecks.includes(c.id);
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={(on ? "Remove" : "Add") + " " + c.title}
              onPress={() => toggleCheck(c.id)}
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
                style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {c.required && (
                  <Badge label="Required" color={p.muted} dot={false} />
                )}
                <Switch
                  value={on}
                  onValueChange={() => toggleCheck(c.id)}
                  trackColor={{ false: p.border, true: p.green }}
                  accessibilityLabel={"Toggle " + c.title}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      {role === "Admin" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save as default checklist for this client"
          onPress={() => {
            setClientChecklists((prev) => ({ ...prev, [eff]: selectedChecks }));
            toast("Default checklist saved for " + eff + ".");
          }}
          style={({ pressed }: any) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 10,
            borderRadius: 7,
            borderWidth: 1,
            borderColor: p.border,
            backgroundColor: p.raised,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Icon name="save-outline" color={p.muted} size={15} />
          <T muted style={{ fontSize: 11 }}>
            Save as default for{" "}
            <T weight="semibold" style={{ fontSize: 11 }}>
              {eff}
            </T>
          </T>
        </Pressable>
      )}

      {!!error && <T style={{ color: p.danger, fontSize: 12 }}>{error}</T>}

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <Button
          label="Back"
          variant="secondary"
          icon="chevron-back-outline"
          onPress={() => setStep("details")}
        />
        <Button
          label="Create verification"
          icon="add-outline"
          disabled={selectedChecks.length === 0}
          onPress={create}
        />
      </View>
    </Dialog>
  );
}

import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useStore } from "../lib/store";
import {
  Page,
  PageHeading,
  Panel,
  T,
  Button,
  Search,
  Chips,
  Badge,
  Icon,
} from "../components/ui";
import { CandidateTable } from "../components/CandidateTable";
import { NewCaseDialog } from "../components/NewCaseDialog";
import { CandidateSelectDialog } from "../components/CandidateSelectDialog";

export default function Candidates({
  verification = false,
}: {
  verification?: boolean;
}) {
  const {
    scoped,
    role,
    settings,
    palette: p,
    organizations,
    candidates,
    selectedCandidate,
    selectedClient,
    selectCandidateAndClient,
  } = useStore();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [page, setPage] = useState(0);
  const [newCase, setNewCase] = useState(false);
  const [selectCandidateOpen, setSelectCandidateOpen] = useState(false);

  const activeCandidate = candidates.find((c) => c.id === selectedCandidate);

  // In Candidate portal, allow browsing all candidates if desired, but default to scoped
  const candidatePool = role === "Candidate" && clientFilter !== "All clients"
    ? candidates.filter((c) => c.company === clientFilter)
    : scoped;

  const filtered = candidatePool.filter(
    (c) =>
      (status === "All statuses" || c.status === status) &&
      (clientFilter === "All clients" || c.company === clientFilter) &&
      [c.name, c.email, c.company, c.id].some((v) =>
        v.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pageCount - 1);

  return (
    <Page>
      <PageHeading
        eyebrow={verification ? "VERIFICATION WORKSPACE" : "PEOPLE & PROGRESS"}
        title={
          role === "Candidate"
            ? "My verification"
            : verification
              ? "Every check. One clear view."
              : "Good people, great possibilities."
        }
        description={
          role === "Candidate"
            ? "Track your background verification and review document feedback."
            : verification
              ? "Track cases, review documents, and keep every verification moving."
              : "Manage your candidates from the first document to the final decision."
        }
        actions={
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <Button
              label={role === "Candidate" ? "Switch candidate" : "Select candidate"}
              icon="people-outline"
              variant="secondary"
              onPress={() => setSelectCandidateOpen(true)}
            />
            {role !== "Candidate" && (
              <Button
                label="New verification"
                icon="add"
                onPress={() => setNewCase(true)}
                disabled={!settings.newCases || settings.maintenance}
              />
            )}
          </View>
        }
      />

      {/* Active candidate banner when in Candidate portal */}
      {role === "Candidate" && activeCandidate && (
        <View
          style={{
            backgroundColor: p.greenBg,
            padding: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.green + "40",
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Icon name="person-circle-outline" size={28} color={p.green} />
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <T weight="semibold" style={{ fontSize: 13, color: p.text }}>
                  Active candidate: {activeCandidate.name}
                </T>
                <Badge label={activeCandidate.status} />
              </View>
              <T muted style={{ fontSize: 11 }}>
                Related client:{" "}
                <T weight="medium" style={{ fontSize: 11, color: p.text }}>
                  {activeCandidate.company}
                </T>{" "}
                · Case {activeCandidate.id} · {activeCandidate.position}
              </T>
            </View>
          </View>
          <Button
            label="Select another candidate"
            icon="people-outline"
            small
            variant="secondary"
            onPress={() => setSelectCandidateOpen(true)}
          />
        </View>
      )}

      <Panel>
        <View style={{ padding: 20, gap: 17 }}>
          <View
            style={{
              flexDirection: width < 650 ? "column" : "row",
              gap: 15,
              justifyContent: "space-between",
            }}
          >
            <View style={{ gap: 3 }}>
              <T weight="semibold" style={{ fontSize: 16 }}>
                {verification ? "Verifications" : "All candidates"}{" "}
                <T muted style={{ fontSize: 12 }}>
                  ({filtered.length})
                </T>
              </T>
              <T muted style={{ fontSize: 11 }}>
                Every candidate is selectable for their related client.
              </T>
            </View>
            <Search
              value={search}
              onChange={(s) => {
                setSearch(s);
                setPage(0);
              }}
              placeholder="Search candidates..."
            />
          </View>

          {/* Related client categories */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="business-outline" size={15} color={p.green} />
                <T weight="semibold" style={{ fontSize: 12 }}>
                  Client categories
                </T>
              </View>
              <T muted style={{ fontSize: 11 }}>
                Candidates categorized by related client organization
              </T>
            </View>
            <Chips
              items={["All clients", ...organizations]}
              value={clientFilter}
              onChange={(c) => {
                setClientFilter(c);
                setPage(0);
              }}
            />
          </View>

          {/* Status filter */}
          <Chips
            items={[
              "All statuses",
              "In progress",
              "Completed",
              "Needs attention",
              "Pending",
            ]}
            value={status}
            onChange={(s) => {
              setStatus(s);
              setPage(0);
            }}
          />
        </View>

        <CandidateTable
          items={filtered.slice(current * 10, current * 10 + 10)}
          onSelectCandidate={selectCandidateAndClient}
        />

        <View
          style={{
            padding: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <T muted style={{ fontSize: 10 }}>
            {filtered.length
              ? `${current * 10 + 1}–${Math.min(current * 10 + 10, filtered.length)} of ${filtered.length}`
              : "0 candidates"}
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button
              small
              label="Previous"
              variant="secondary"
              onPress={() => setPage(current - 1)}
              disabled={current === 0}
            />
            <T muted style={{ fontSize: 10 }}>
              {current + 1} / {pageCount}
            </T>
            <Button
              small
              label="Next"
              variant="secondary"
              onPress={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
            />
          </View>
        </View>
      </Panel>
      <NewCaseDialog visible={newCase} onClose={() => setNewCase(false)} />
      <CandidateSelectDialog
        visible={selectCandidateOpen}
        onClose={() => setSelectCandidateOpen(false)}
        initialCompany={clientFilter !== "All clients" ? clientFilter : undefined}
      />
    </Page>
  );
}


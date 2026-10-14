import React, { useState, useMemo } from "react";
import { View, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { useStore } from "../lib/store";
import { Candidate } from "../lib/data";
import { Dialog, T, Search, Chips, Avatar, Badge, Icon, Button, Empty } from "./ui";

export function CandidateSelectDialog({
  visible,
  onClose,
  initialCompany,
  title = "Select candidate for client",
  description = "Choose any candidate for the selected client. Every candidate is selectable with no default lock.",
  onSelected,
}: {
  visible: boolean;
  onClose: () => void;
  initialCompany?: string;
  title?: string;
  description?: string;
  onSelected?: (candidate: Candidate) => void;
}) {
  const {
    candidates,
    organizations,
    selectedCandidate,
    selectedClient,
    selectCandidateAndClient,
    palette: p,
    toast,
    log,
  } = useStore();
  const { width } = useWindowDimensions();
  // client state
  const [client, setClient] = useState(
    initialCompany ?? selectedClient ?? "All clients",
  );
  const [query, setQuery] = useState("");

  // Sync initialCompany if passed
  React.useEffect(() => {
    if (visible) {
      if (initialCompany) {
        setClient(initialCompany);
      } else if (selectedClient) {
        setClient(selectedClient);
      }
      setQuery("");
    }
  }, [visible, initialCompany, selectedClient]);
  // client chips
  const clientChips = useMemo(() => ["All clients", ...organizations], [organizations]);
  // candidate for clients
  const candidatesForClient = useMemo(() => {
    return candidates.filter((c) => {
      const matchClient = client === "All clients" || c.company === client;
      const matchQuery =
        !query.trim() ||
        [c.name, c.email, c.position, c.id, c.company].some((field) =>
          field.toLowerCase().includes(query.toLowerCase()),
        );
      return matchClient && matchQuery;
    });
  }, [candidates, client, query]);
  // client category groups
  const clientCategoryGroups = useMemo(() => {
    const groups: { company: string; candidates: Candidate[] }[] = [];
    const map = new Map<string, Candidate[]>();
    for (const c of candidatesForClient) {
      if (!map.has(c.company)) {
        map.set(c.company, []);
      }
      map.get(c.company)!.push(c);
    }
    for (const [company, list] of map.entries()) {
      groups.push({ company, candidates: list });
    }
    return groups;
  }, [candidatesForClient]);
  // handle select candidate 
  const handleSelect = (candidate: Candidate) => {
    selectCandidateAndClient(candidate.id);
    log(
      "Candidate selected",
      `${candidate.name} · ${candidate.company}`,
      "person-outline",
    );
    toast(`Active candidate set to ${candidate.name} (${candidate.company}).`);
    if (onSelected) {
      onSelected(candidate);
    }
    onClose();
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={title}
      description={description}
      width={680}
    >
      <View style={{ gap: 15 }}>
        {/* Client selection section */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon name="business-outline" size={15} color={p.green} />
              <T weight="semibold" style={{ fontSize: 12 }}>
                Related client category
              </T>
            </View>
            <T muted style={{ fontSize: 11 }}>
              {client === "All clients"
                ? `${candidates.length} total candidates`
                : `${candidates.filter((c) => c.company === client).length} candidates for ${client}`}
            </T>
          </View>
          <Chips items={clientChips} value={client} onChange={setClient} />
        </View>

        {/* Candidate search */}
        <Search
          placeholder="Filter candidate by name, email, position..."
          value={query}
          onChange={setQuery}
        />

        {/* Candidate list */}
        <View style={{ maxHeight: 360 }}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ gap: 10, paddingBottom: 10 }}
          >
            {candidatesForClient.length === 0 ? (
              <Empty
                icon="people-outline"
                title="No candidates found"
                description={`No candidates found for ${client} matching your search.`}
              />
            ) : (
              clientCategoryGroups.map((group) => (
                <View key={"group-cat-" + group.company} style={{ gap: 6, marginBottom: 4 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      backgroundColor: p.raised,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: p.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Icon name="business-outline" size={13} color={p.green} />
                      <T weight="semibold" style={{ fontSize: 11 }}>
                        {group.company}
                      </T>
                    </View>
                    <Badge
                      label={`${group.candidates.length} candidate${group.candidates.length > 1 ? "s" : ""}`}
                      color={p.muted}
                      dot={false}
                    />
                  </View>
                  {group.candidates.map((c) => {
                    const isCurrent = c.id === selectedCandidate;
                    return (
                      <Pressable
                        key={c.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Select candidate ${c.name} for ${c.company}`}
                        onPress={() => handleSelect(c)}
                        style={({ hovered }: any) => ({
                          padding: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isCurrent
                            ? p.green + "88"
                            : hovered
                              ? p.border
                              : p.border + "66",
                          backgroundColor: isCurrent
                            ? p.greenBg
                            : hovered
                              ? p.raised
                              : p.panel,
                          flexDirection: width < 550 ? "column" : "row",
                          alignItems: width < 550 ? "flex-start" : "center",
                          justifyContent: "space-between",
                          gap: 12,
                        })}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            flex: 1,
                          }}
                        >
                          <Avatar name={c.name} color={c.color} size={36} />
                          <View style={{ flex: 1, gap: 2 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <T weight="semibold" style={{ fontSize: 12 }}>
                                {c.name}
                              </T>
                              {isCurrent && (
                                <Badge label="Currently selected" color={p.green} />
                              )}
                            </View>
                            <T muted style={{ fontSize: 11 }}>
                              {c.position} ·{" "}
                              <T weight="medium" style={{ fontSize: 11, color: p.text }}>
                                {c.company}
                              </T>
                            </T>
                            <T muted style={{ fontSize: 10 }}>
                              {c.email} · {c.id}
                            </T>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            alignSelf: width < 550 ? "flex-end" : "center",
                          }}
                        >
                          <Badge label={c.status} />
                          <Button
                            label={isCurrent ? "Selected" : "Select candidate"}
                            small
                            variant={isCurrent ? "secondary" : "primary"}
                            icon={isCurrent ? "checkmark" : "chevron-forward"}
                            onPress={() => handleSelect(c)}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: p.border,
          }}
        >
          <T muted style={{ fontSize: 11 }}>
            Showing {Math.min(candidatesForClient.length, 100)} candidates
          </T>
          <Button label="Close" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Dialog>
  );
}

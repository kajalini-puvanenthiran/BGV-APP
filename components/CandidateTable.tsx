import React from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { Candidate } from "../lib/data";
import { useStore } from "../lib/store";
import { openCase } from "../lib/navigation";
import { T, Avatar, Badge, Icon, Empty } from "./ui";
export function CandidateTable({
  items,
  compact = false,
  categorized = true,
  onSelect = openCase,
  onSelectCandidate,
  onEdit,
  onDelete,
}: {
  items: Candidate[];
  compact?: boolean;
  categorized?: boolean;
  onSelect?: (id: string) => void;
  onSelectCandidate?: (id: string) => void;
  onEdit?: (c: Candidate) => void;
  onDelete?: (c: Candidate) => void;
}) {
  const { palette: p, selectedCandidate } = useStore();
  const { width } = useWindowDimensions();
  const mobile = width < 700;

  const clientGroups = React.useMemo(() => {
    const groups: { company: string; list: Candidate[] }[] = [];
    const map = new Map<string, Candidate[]>();
    for (const c of items) {
      if (!map.has(c.company)) {
        map.set(c.company, []);
      }
      map.get(c.company)!.push(c);
    }
    for (const [company, list] of map.entries()) {
      groups.push({ company, list });
    }
    return groups;
  }, [items]);

  const renderRow = (c: Candidate, index: number) => {
    if (!c) return null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${c.name || "candidate"}`}
        key={c.id || `candidate-${index}`}
        onPress={() => onSelect(c.id)}
        style={({ hovered }: any) => ({
          paddingHorizontal: 20,
          paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: p.border + "99",
        backgroundColor: hovered ? p.raised : "transparent",
        gap: mobile ? 12 : 0,
      })}
    >
            <View
              style={{
                flex: compact ? 2.3 : 2,
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Avatar name={c.name} color={c.color} size={33} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <T weight="medium" style={{ fontSize: 11 }} numberOfLines={1}>
                    {c.name}
                  </T>
                  {c.id === selectedCandidate && (
                    <View
                      style={{
                        backgroundColor: p.green + "20",
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 4,
                      }}
                    >
                      <T
                        style={{
                          fontSize: 9,
                          color: p.green,
                          fontFamily: "Inter_600SemiBold",
                        }}
                      >
                        Active
                      </T>
                    </View>
                  )}
                </View>
                <T
                  muted
                  style={{ fontSize: 9, lineHeight: 16 }}
                  numberOfLines={1}
                >
                  {compact ? c.company : c.email}
                </T>
              </View>
            </View>
            {!mobile && !compact && (
              <T muted style={{ fontSize: 11, flex: 1.5 }}>
                {c.company}
              </T>
            )}
            <View style={{ flex: mobile ? undefined : 1.5 }}>
              <Badge label={c.status} />
            </View>
            {!mobile && (
              <View
                style={{
                  flex: 1.2,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                  paddingRight: 17,
                }}
              >
                <View
                  style={{
                    height: 4,
                    backgroundColor: p.border,
                    borderRadius: 4,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      width: `${c.progress}%`,
                      borderRadius: 4,
                      backgroundColor:
                        c.status === "Needs attention" ? p.amber : p.green,
                    }}
                  />
                </View>
                <T muted style={{ fontSize: 10, width: 28 }}>
                  {c.progress}%
                </T>
              </View>
            )}
            {!mobile && !compact && (
              <T muted style={{ fontSize: 10, flex: 1 }}>
                {c.created.slice(5).replace("-", " / ")}
              </T>
            )}
            {onSelectCandidate && c.id !== selectedCandidate ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Select ${c.name} for ${c.company}`}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onSelectCandidate(c.id);
                }}
                style={({ hovered }: any) => ({
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 5,
                  backgroundColor: hovered ? p.green + "20" : p.raised,
                  borderWidth: 1,
                  borderColor: p.border,
                  marginRight: 6,
                })}
              >
                <T style={{ fontSize: 10, color: p.green }}>Select</T>
              </Pressable>
            ) : null}
            {onEdit && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${c.name}`}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEdit(c);
                }}
                style={({ hovered }: any) => ({
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                  borderRadius: 5,
                  backgroundColor: hovered ? p.raised : "transparent",
                  marginRight: 4,
                })}
              >
                <Icon name="create-outline" size={14} color={p.muted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${c.name}`}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDelete(c);
                }}
                style={({ hovered }: any) => ({
                  paddingHorizontal: 7,
                  paddingVertical: 4,
                  borderRadius: 5,
                  backgroundColor: hovered ? p.danger + "20" : "transparent",
                  marginRight: 6,
                })}
              >
                <Icon name="trash-outline" size={14} color={p.danger} />
              </Pressable>
            )}
            <Icon name="chevron-forward" size={14} />
    </Pressable>
  );
};

  return (
    <View>
      {!mobile && (
        <View
          style={{
            paddingVertical: 11,
            paddingHorizontal: 20,
            flexDirection: "row",
            backgroundColor: p.raised + "88",
            borderBottomWidth: 1,
            borderColor: p.border,
          }}
        >
          <T muted style={{ fontSize: 10, flex: compact ? 2.3 : 2 }}>
            CANDIDATE
          </T>
          {!compact && (
            <T muted style={{ fontSize: 10, flex: 1.5 }}>
              CLIENT
            </T>
          )}
          <T muted style={{ fontSize: 10, flex: 1.5 }}>
            STATUS
          </T>
          <T muted style={{ fontSize: 10, flex: 1.2 }}>
            PROGRESS
          </T>
          {!compact && (
            <T muted style={{ fontSize: 10, flex: 1 }}>
              CREATED
            </T>
          )}
          <View style={{ width: 20 }} />
        </View>
      )}
      {items.length === 0 ? (
        <Empty
          title="No candidates found"
          description="Try a different name, client, or status filter."
        />
      ) : categorized && !compact ? (
        clientGroups.map((group) => (
          <View key={"group-" + group.company}>
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 9,
                backgroundColor: p.raised,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: p.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="business-outline" size={14} color={p.green} />
                <T weight="semibold" style={{ fontSize: 11, color: p.text }}>
                  {group.company}
                </T>
                <Badge
                  label={`${group.list.length} candidate${group.list.length > 1 ? "s" : ""}`}
                  color={p.muted}
                  dot={false}
                />
              </View>
              <T muted style={{ fontSize: 9 }}>
                Client category
              </T>
            </View>
            {group.list.map(renderRow)}
          </View>
        ))
      ) : (
        items.map(renderRow)
      )}
    </View>
  );
}

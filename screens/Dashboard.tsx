import React, { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useStore } from "../lib/store";
import {
  Page,
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Badge,
  IconButton,
} from "../components/ui";
import { Sparkline, TrendChart, Donut } from "../components/charts";
import { CandidateTable } from "../components/CandidateTable";
import { NewCaseDialog } from "../components/NewCaseDialog";
import { navigateTo } from "../lib/navigation";
import { exportText, csvValue } from "../lib/files";
import { CandidateSelectDialog } from "../components/CandidateSelectDialog";
export default function Dashboard() {
  const {
    palette: p,
    role,
    scoped,
    activities,
    settings,
    toast,
    uploads,
    checks,
    candidates,
    selectedCandidate,
  } = useStore();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const [newCase, setNewCase] = useState(false);
  const [range, setRange] = useState("30 days");
  const [selectCandidate, setSelectCandidate] = useState(false);

  const activeCandidateId =
    role === "Candidate"
      ? selectedCandidate
      : (scoped[0]?.id || "BGV-2026001");
  const activeCandidate =
    candidates.find((c) => c.id === activeCandidateId) ||
    scoped[0] ||
    candidates[0];

  const completed = scoped.filter((c) => c.status === "Completed").length;
  const progress = scoped.filter((c) => c.status === "In progress").length;
  const attention = scoped.filter((c) => c.status === "Needs attention").length;
  const exportReport = async () => {
    if (!settings.exports) {
      toast("Report exports are disabled by your administrator.");
      return;
    }
    try {
      await exportText(
        "bgv-verification-summary.csv",
        [
          ["Case ID", "Candidate", "Client", "Status", "Progress"].join(","),
          ...scoped.map((c) =>
            [c.id, c.name, c.company, c.status, c.progress + "%"]
              .map(csvValue)
              .join(","),
          ),
        ].join("\n"),
      );
      toast("Report exported successfully.");
    } catch {
      toast("Unable to export the report. Please try again.");
    }
  };
  const metrics = [
    {
      label: "Total verifications",
      value: scoped.length,
      icon: "shield-checkmark-outline",
      color: p.purple,
      change: "All time",
      detail: "across your workspace",
    },
    {
      label: "In progress",
      value: progress,
      icon: "time-outline",
      color: p.blue,
      change: "Active",
      detail: "moving toward completion",
    },
    {
      label: "Completed",
      value: completed,
      icon: "checkmark-circle-outline",
      color: p.green,
      change: `${Math.round((completed / (scoped.length || 1)) * 100)}%`,
      detail: "of all verifications",
    },
    {
      label: "Needs attention",
      value: attention,
      icon: "alert-circle-outline",
      color: p.amber,
      change: "Review",
      detail: "awaiting your action",
    },
  ];
  if (role === "Candidate")
    return (
      <Page>
        <PageHeading
          eyebrow="YOUR CANDIDATE PORTAL"
          title={`Welcome, ${activeCandidate?.name.split(" ")[0] || "Candidate"}.`}
          description={`Logged in as ${activeCandidate?.name || "Candidate"} · ${activeCandidate?.company || "Acme Corporation"}.`}
          actions={
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <Button
                label="Switch candidate"
                icon="people-outline"
                variant="secondary"
                onPress={() => setSelectCandidate(true)}
              />
              <Button
                label="Upload documents"
                icon="cloud-upload-outline"
                onPress={() => navigateTo("Checklist")}
              />
            </View>
          }
        />
        <Panel
          style={{ padding: 27, marginBottom: 22, backgroundColor: p.greenBg }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <View
              style={{
                padding: 17,
                borderRadius: 50,
                backgroundColor: p.green + "15",
              }}
            >
              <Icon name="shield-checkmark-outline" color={p.green} size={33} />
            </View>
            <View style={{ flex: 1, gap: 7 }}>
              <T weight="heading" style={{ fontSize: 22, lineHeight: 29 }}>
                Your next opportunity is taking shape.
              </T>
              <T muted>
                Complete your checklist so our team can get your verification
                moving.
              </T>
            </View>
          </View>
          <View
            style={{
              height: 5,
              backgroundColor: p.border,
              marginTop: 25,
              borderRadius: 4,
            }}
          >
            <View
              style={{
                height: 5,
                width: `${Math.min(100, (uploads.filter((u) => u.candidateId === activeCandidateId).length / checks.filter((c) => c.enabled).reduce((n, c) => n + c.documents.length, 0)) * 100)}%`,
                backgroundColor: p.green,
                borderRadius: 4,
              }}
            />
          </View>
          <T muted style={{ fontSize: 11, marginTop: 10 }}>
            {uploads.filter((u) => u.candidateId === activeCandidateId).length}{" "}
            documents uploaded · {checks.filter((c) => c.enabled).length}{" "}
            verification checks
          </T>
        </Panel>
        <CandidateSelectDialog
          visible={selectCandidate}
          onClose={() => setSelectCandidate(false)}
          initialCompany={activeCandidate?.company}
          title="Select candidate for portal"
          description="Switch to any candidate for their related client. Every candidate is selectable with no default lock."
        />
        <View
          style={{ flexDirection: width < 650 ? "column" : "row", gap: 18 }}
        >
          {[
            {
              title: "Your checklist",
              description:
                "See every requirement in one place and save sample documents on this device.",
              icon: "list-outline",
              action: "View checklist",
              screen: "Checklist",
            },
            {
              title: "Verification status",
              description:
                "Follow your verification and review feedback from your administrator.",
              icon: "shield-outline",
              action: "View my verification",
              screen: "Verifications",
            },
            {
              title: "Your preferences",
              description:
                "Manage your appearance and notification preferences.",
              icon: "options-outline",
              action: "Open settings",
              screen: "Settings",
            },
          ].map((x) => (
            <Panel key={x.title} style={{ flex: 1, padding: 24, gap: 13 }}>
              <Icon name={x.icon} color={p.green} size={26} />
              <T weight="semibold" style={{ fontSize: 16 }}>
                {x.title}
              </T>
              <T muted style={{ fontSize: 12, lineHeight: 21 }}>
                {x.description}
              </T>
              <Button
                label={x.action}
                variant="secondary"
                onPress={() => navigateTo(x.screen)}
              />
            </Panel>
          ))}
        </View>
        <Panel style={{ padding: 22, marginTop: 22, gap: 9 }}>
          <T weight="semibold">Your privacy comes first</T>
          <T muted>
            This demonstration stores your files on this device only. Use sample
            documents, not real identity, financial, or medical information. A
            production deployment needs authenticated accounts and encrypted
            server-side storage.
          </T>
        </Panel>
      </Page>
    );
  return (
    <Page>
      <PageHeading
        eyebrow="FRIDAY, SEPTEMBER 25, 2026"
        title={
          role === "Client"
            ? "A clearer view of your next hires."
            : "Confidence in every hire."
        }
        description="Your people. Your progress. Your verifications, all in one place."
        actions={
          <>
            <Button
              label="Export report"
              icon="download-outline"
              variant="secondary"
              onPress={exportReport}
            />
            <Button
              label="New verification"
              icon="add"
              onPress={() => setNewCase(true)}
              disabled={!settings.newCases || settings.maintenance}
            />
          </>
        }
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 22,
        }}
      >
        {metrics.map((m, i) => (
          <Animated.View
            entering={FadeInDown.delay(i * 60).duration(400)}
            key={m.label}
            style={{ flex: 1, minWidth: width < 650 ? "44%" : 150 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${m.label.toLowerCase()}`}
              onPress={() =>
                navigateTo(i === 0 ? "Candidates" : "Verifications")
              }
            >
              <Panel style={{ padding: width < 650 ? 15 : 19, height: 132 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
                >
                  <View
                    style={{
                      padding: 6,
                      backgroundColor: m.color + "12",
                      borderRadius: 6,
                    }}
                  >
                    <Icon name={m.icon} color={m.color} size={16} />
                  </View>
                  <T
                    muted
                    weight="medium"
                    numberOfLines={2}
                    style={{
                      fontSize: width < 650 ? 10 : 11,
                      lineHeight: 16,
                      flex: 1,
                    }}
                  >
                    {m.label}
                  </T>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 9,
                  }}
                >
                  <T
                    weight="heading"
                    style={{ fontSize: 32, lineHeight: 38, letterSpacing: -1 }}
                  >
                    {m.value.toLocaleString()}
                  </T>
                  <Sparkline color={m.color} index={i} compact={width < 650} />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 5,
                  }}
                >
                  <T
                    weight="medium"
                    style={{ fontSize: 9, color: i === 3 ? p.amber : p.green }}
                  >
                    {m.change}
                  </T>
                  <T muted numberOfLines={1} style={{ fontSize: 9, flex: 1 }}>
                    {width < 650
                      ? [
                        "total cases",
                        "active cases",
                        "complete",
                        "needs review",
                      ][i]
                      : m.detail}
                  </T>
                </View>
              </Panel>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 20,
          marginBottom: 22,
        }}
      >
        <Panel style={{ flex: 1.75, minHeight: 269 }}>
          <View
            style={{
              flexDirection: width < 650 ? "column" : "row",
              alignItems: width < 650 ? "flex-start" : "center",
              gap: width < 650 ? 12 : 0,
              justifyContent: "space-between",
              padding: 20,
              paddingBottom: 8,
            }}
          >
            <View style={{ gap: 3 }}>
              <T weight="semibold" style={{ fontSize: 14 }}>
                Verification overview
              </T>
              <T muted style={{ fontSize: 10 }}>
                A little progress, every day.
              </T>
            </View>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: p.bg,
                padding: 3,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: p.border,
              }}
            >
              {["7 days", "30 days", "90 days"].map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setRange(x)}
                  accessibilityRole="button"
                  accessibilityLabel={x}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    backgroundColor: range === x ? p.raised : "transparent",
                    borderRadius: 4,
                  }}
                >
                  <T
                    style={{
                      fontSize: 9,
                      color: range === x ? p.text : p.muted,
                    }}
                  >
                    {x}
                  </T>
                </Pressable>
              ))}
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 17,
              paddingHorizontal: 21,
              paddingVertical: 9,
            }}
          >
            {[
              { label: "Total verifications", color: p.green },
              { label: "Completed", color: p.blue },
            ].map((x) => (
              <View
                key={x.label}
                style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
              >
                <View
                  style={{
                    height: 6,
                    width: 6,
                    backgroundColor: x.color,
                    borderRadius: 3,
                  }}
                />
                <T muted style={{ fontSize: 9 }}>
                  {x.label}
                </T>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 13, paddingBottom: 15 }}>
            <TrendChart range={range} />
          </View>
        </Panel>
        <Panel style={{ flex: 1, minHeight: 269 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 19,
            }}
          >
            <T weight="semibold" style={{ fontSize: 14 }}>
              Verification breakdown
            </T>
            <IconButton
              name="information-circle-outline"
              size={17}
              label="About verification breakdown"
              onPress={() =>
                toast(
                  "Status distribution across all verifications visible to your portal.",
                )
              }
            />
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <Donut />
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderColor: p.border,
              marginHorizontal: 20,
              paddingVertical: 12,
              flexDirection: "row",
              gap: 7,
              alignItems: "center",
            }}
          >
            <Icon name="trending-up-outline" color={p.green} size={14} />
            <T muted style={{ fontSize: 10 }}>
              <T style={{ color: p.green, fontSize: 10 }}>
                {Math.round((completed / (scoped.length || 1)) * 100)}% complete
              </T>{" "}
              — making hiring move forward
            </T>
          </View>
        </Panel>
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 20 }}>
        <Panel style={{ flex: 1.75 }}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 9 }}
            >
              <T weight="semibold" style={{ fontSize: 14 }}>
                Recent candidates
              </T>
              <Badge
                label={String(scoped.length)}
                color={p.muted}
                dot={false}
              />
            </View>
            <Pressable
              onPress={() => navigateTo("Candidates")}
              accessibilityRole="button"
              accessibilityLabel="View all candidates"
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              <T style={{ fontSize: 10, color: p.green }} weight="medium">
                View all candidates
              </T>
              <Icon name="arrow-forward" size={13} color={p.green} />
            </Pressable>
          </View>
          <CandidateTable compact items={scoped.slice(0, 5)} />
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
            }}
          >
            <View
              style={{
                height: 5,
                width: 5,
                borderRadius: 3,
                backgroundColor: p.green,
              }}
            />
            <T muted style={{ fontSize: 9 }}>
              Showing the most recent activity in your workspace
            </T>
          </View>
        </Panel>
        <Panel style={{ flex: 1 }}>
          <View
            style={{
              padding: 20,
              paddingBottom: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <T weight="semibold" style={{ fontSize: 14 }}>
              Recent activity
            </T>
            <View
              style={{
                backgroundColor: p.greenBg,
                paddingHorizontal: 7,
                paddingVertical: 1,
                borderRadius: 4,
              }}
            >
              <T style={{ color: p.green, fontSize: 9 }}>Live feed</T>
            </View>
          </View>
          {activities
            .filter((a) => role === "Admin" || a.detail.includes("Acme"))
            .slice(0, 4)
            .map((a, i) => (
              <View
                key={a.id}
                style={{
                  flexDirection: "row",
                  gap: 11,
                  paddingHorizontal: 20,
                  paddingBottom: 21,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 29,
                      height: 29,
                      borderRadius: 16,
                      backgroundColor: a.color + "13",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={a.icon} color={a.color} size={15} />
                  </View>
                  {i < 3 && (
                    <View
                      style={{
                        position: "absolute",
                        top: 35,
                        bottom: -14,
                        width: 1,
                        backgroundColor: p.border,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <T weight="medium" style={{ fontSize: 10, lineHeight: 17 }}>
                    {a.text}
                  </T>
                  <T
                    muted
                    style={{ fontSize: 9, lineHeight: 16 }}
                    numberOfLines={1}
                  >
                    {a.detail}
                  </T>
                  <T
                    style={{
                      fontSize: 9,
                      color: p.subtle,
                      lineHeight: 17,
                      marginTop: 2,
                    }}
                  >
                    {a.id.startsWith("a")
                      ? [
                        "10 minutes ago",
                        "30 minutes ago",
                        "1 hour ago",
                        "2 hours ago",
                      ][i]
                      : "Just now"}
                  </T>
                </View>
              </View>
            ))}
          <Pressable
            onPress={() => navigateTo("Reports")}
            accessibilityRole="button"
            accessibilityLabel="View activity log"
            style={{
              marginHorizontal: 20,
              borderTopWidth: 1,
              borderColor: p.border,
              paddingVertical: 13,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <T muted style={{ fontSize: 10 }}>
              View activity log
            </T>
            <Icon name="arrow-forward" size={13} />
          </Pressable>
        </Panel>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 21,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Icon name="lock-closed-outline" size={11} />
          <T muted style={{ fontSize: 9 }}>
            Thoughtful checks. Trusted decisions.
          </T>
        </View>
        <T style={{ fontSize: 9, color: p.subtle }}>
          BGV Checker · Demo workspace
        </T>
      </View>
      <NewCaseDialog visible={newCase} onClose={() => setNewCase(false)} />
    </Page>
  );
}

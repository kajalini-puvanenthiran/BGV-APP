import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useStore } from "../lib/store";
import {
  Page,
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Chips,
  Badge,
  Empty,
} from "../components/ui";
import { CandidateTable } from "../components/CandidateTable";
import { exportText, csvValue } from "../lib/files";
export default function Reports() {
  const {
    palette: p,
    scoped,
    activities,
    settings,
    role,
    uploads,
    toast,
  } = useStore();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState("Verification reports");
  const complete = scoped.filter((c) => c.status === "Completed");
  const activity = activities.filter(
    (a) =>
      role === "Admin" ||
      a.detail.includes(role === "Candidate" ? "Olivia Rhye" : "Acme"),
  );
  const exportReport = async () => {
    if (!settings.exports) {
      toast("Report exports are disabled by your administrator.");
      return;
    }
    const isLog = tab === "Activity log";
    const rows = isLog
      ? [
          ["Timestamp", "Event", "Details"],
          ...activity.map((a) => [a.time, a.text, a.detail]),
        ]
      : [
          ["Case ID", "Candidate", "Client", "Status", "Progress", "Created"],
          ...scoped.map((c) => [
            c.id,
            c.name,
            c.company,
            c.status,
            c.progress,
            c.created,
          ]),
        ];
    try {
      await exportText(
        isLog ? "bgv-activity-log.csv" : "bgv-verification-report.csv",
        rows.map((row) => row.map(csvValue).join(",")).join("\n"),
      );
      toast("Your report has been exported.");
    } catch {
      toast("Report export failed. Please try again.");
    }
  };
  return (
    <Page>
      <PageHeading
        eyebrow="INSIGHTS THAT MOVE YOU FORWARD"
        title="From information to confidence."
        description="Clear reports and a traceable history of your verification process."
        actions={
          <Button
            label="Export CSV"
            icon="download-outline"
            onPress={exportReport}
            disabled={!settings.exports}
          />
        }
      />
      <View
        style={{
          flexDirection: width < 650 ? "column" : "row",
          gap: 18,
          marginBottom: 23,
        }}
      >
        {[
          {
            label: "Completion rate",
            value:
              Math.round((complete.length / (scoped.length || 1)) * 100) + "%",
            icon: "checkmark-done-outline",
            color: p.green,
          },
          {
            label: "Completed verifications",
            value: complete.length,
            icon: "shield-checkmark-outline",
            color: p.blue,
          },
          {
            label: "Documents awaiting review",
            value: uploads.filter(
              (u) =>
                u.status === "In review" &&
                scoped.some((c) => c.id === u.candidateId),
            ).length,
            icon: "documents-outline",
            color: p.amber,
          },
        ].map((m) => (
          <Panel key={m.label} style={{ flex: 1, padding: 23, gap: 14 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <T muted style={{ fontSize: 12 }}>
                {m.label}
              </T>
              <Icon name={m.icon} color={m.color} />
            </View>
            <T weight="heading" style={{ fontSize: 32, lineHeight: 42 }}>
              {m.value}
            </T>
          </Panel>
        ))}
      </View>
      <View style={{ marginBottom: 20 }}>
        <Chips
          items={["Verification reports", "Activity log"]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <Panel>
        <View
          style={{
            padding: 22,
            borderBottomWidth: 1,
            borderColor: p.border,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <T weight="semibold" style={{ fontSize: 15 }}>
            {tab === "Activity log"
              ? "Workspace audit trail"
              : "Recently completed verifications"}
          </T>
          <Badge
            label={
              tab === "Activity log"
                ? `${activity.length} events`
                : `${complete.length} completed`
            }
            color={p.green}
            dot={false}
          />
        </View>
        {tab === "Verification reports" ? (
          <CandidateTable items={complete.slice(0, 12)} />
        ) : activity.length ? (
          activity.map((a) => (
            <View
              key={a.id}
              style={{
                padding: 21,
                borderBottomWidth: 1,
                borderColor: p.border,
                flexDirection: "row",
                gap: 15,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: a.color + "15",
                }}
              >
                <Icon name={a.icon} color={a.color} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <T weight="medium" style={{ fontSize: 12 }}>
                  {a.text}
                </T>
                <T muted style={{ fontSize: 11 }}>
                  {a.detail}
                </T>
              </View>
              <T muted style={{ fontSize: 10 }}>
                {new Date(a.time).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </T>
            </View>
          ))
        ) : (
          <Empty
            title="Your audit trail starts here"
            description="New actions from your portal will appear here."
            icon="time-outline"
          />
        )}
      </Panel>
      <T muted style={{ fontSize: 10, marginTop: 15 }}>
        Demo reports summarize the local workspace only. They are not certified
        background check results.
      </T>
    </Page>
  );
}

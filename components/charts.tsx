import React from "react";
import { View, useWindowDimensions } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { useStore } from "../lib/store";
import { T } from "./ui";
export function Sparkline({
  color,
  index = 0,
  compact = false,
}: {
  color: string;
  index?: number;
  compact?: boolean;
}) {
  const paths = [
    "M0,27 L10,23 L20,27 L30,17 L40,21 L50,9 L60,14 L70,6 L80,11 L90,2",
    "M0,9 L10,12 L20,5 L30,15 L40,12 L50,24 L60,18 L70,28 L80,23 L90,27",
    "M0,29 L10,24 L20,26 L30,18 L40,19 L50,10 L60,16 L70,7 L80,8 L90,1",
    "M0,6 L10,11 L20,7 L30,18 L40,12 L50,25 L60,20 L70,26 L80,22 L90,29",
  ];
  return (
    <Svg width={compact ? 57 : 83} height={35} viewBox="0 0 95 35">
      <Path d={paths[index % 4]} fill="none" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
export function TrendChart({ range }: { range: string }) {
  const { palette: p, scoped } = useStore();
  const { width } = useWindowDimensions();
  const days = parseInt(range);
  const dayMs = 86400000;
  const end = Date.UTC(2026, 8, 26);
  const start = end - days * dayMs;
  const bins = days === 7 ? 7 : 10;
  const raw = Array.from({ length: bins }, (_, i) => {
    const from = start + i * (days / bins) * dayMs;
    const to = start + (i + 1) * (days / bins) * dayMs;
    const matches = scoped.filter((c) => {
      const time = Date.parse(c.created + "T12:00:00Z");
      return time >= from && time < to;
    });
    return {
      total: matches.length,
      completed: matches.filter((c) => c.status === "Completed").length,
    };
  });
  const max = Math.ceil(Math.max(10, ...raw.map((d) => d.total)) / 10) * 10;
  const points = raw.map((d, i) => ({
    x: 42 + i * (568 / (raw.length - 1)),
    y: 148 - (d.total / max) * 118,
  }));
  const complete = raw.map((d, i) => ({
    x: 42 + i * (568 / (raw.length - 1)),
    y: 148 - (d.completed / max) * 118,
  }));
  const path = (ps: { x: number; y: number }[]) =>
    ps
      .map((v, i) =>
        i === 0
          ? `M ${v.x} ${v.y}`
          : `C ${(ps[i - 1].x + v.x) / 2} ${ps[i - 1].y}, ${(ps[i - 1].x + v.x) / 2} ${v.y}, ${v.x} ${v.y}`,
      )
      .join(" ");
  const labelCount = width < 600 ? 4 : 6;
  const labels = Array.from({ length: labelCount }, (_, i) =>
    new Date(
      start + i * ((days - 1) / (labelCount - 1)) * dayMs,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    }),
  );
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Svg
        accessibilityLabel={`Verification activity over ${range}`}
        width="100%"
        height={150}
        viewBox="0 0 638 180"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.green} stopOpacity={0.24} />
            <Stop offset="1" stopColor={p.green} stopOpacity={0.015} />
          </LinearGradient>
        </Defs>
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <Line
              x1="42"
              x2="613"
              y1={30 + i * 39.3}
              y2={30 + i * 39.3}
              stroke={p.border}
              strokeDasharray="3 5"
            />
            <SvgText
              x="4"
              y={34 + i * 39.3}
              fontSize={width < 600 ? 16 : 10}
              fill={p.subtle}
            >
              {Math.round(max * (1 - i / 3))}
            </SvgText>
          </React.Fragment>
        ))}
        <Path d={path(points) + " L 610 148 L 42 148 Z"} fill="url(#area)" />
        <Path
          d={path(complete)}
          fill="none"
          stroke={p.blue}
          strokeWidth="1.6"
          strokeDasharray="5 5"
          opacity=".7"
        />
        <Path
          d={path(points)}
          fill="none"
          stroke={p.green}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <Circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={p.panel}
          stroke={p.green}
          strokeWidth="2"
        />
        {labels.map((label, i) => (
          <SvgText
            key={i}
            x={42 + i * (568 / (labels.length - 1))}
            y="175"
            fill={p.muted}
            fontSize={width < 600 ? 16 : 10}
            textAnchor={
              i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"
            }
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
export function Donut() {
  const { palette: p, scoped } = useStore();
  const groups = [
    {
      label: "Completed",
      n: scoped.filter((c) => c.status === "Completed").length,
      color: p.green,
    },
    {
      label: "In progress",
      n: scoped.filter((c) => c.status === "In progress").length,
      color: p.blue,
    },
    {
      label: "Needs attention",
      n: scoped.filter((c) => c.status === "Needs attention").length,
      color: p.amber,
    },
    {
      label: "Pending",
      n: scoped.filter((c) => c.status === "Pending").length,
      color: p.subtle,
    },
  ];
  const total = scoped.length || 1;
  const circumference = 2 * Math.PI * 57;
  let offset = 0;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        gap: 12,
        paddingVertical: 10,
        flex: 1,
      }}
    >
      <View style={{ width: 152, height: 152 }}>
        <Svg width={152} height={152} viewBox="0 0 152 152">
          <Circle
            cx={76}
            cy={76}
            r={57}
            fill="none"
            stroke={p.border}
            strokeWidth={14}
          />
          {groups.map((g) => {
            const start = offset;
            offset += (g.n / total) * circumference;
            if (g.n === 0) return null;
            return (
              <Circle
                key={g.label}
                cx={76}
                cy={76}
                r={57}
                fill="none"
                stroke={g.color}
                strokeWidth={14}
                strokeDasharray={`${Math.max(0, (g.n / total) * circumference - 4)} ${circumference}`}
                strokeDashoffset={String(-start)}
                rotation="-90"
                origin="76,76"
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
        <View
          style={{
            position: "absolute",
            inset: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <T weight="heading" style={{ fontSize: 29, lineHeight: 36 }}>
            {scoped.length}
          </T>
          <T muted style={{ fontSize: 10 }}>
            Total checks
          </T>
        </View>
      </View>
      <View style={{ gap: 15, flex: 1, maxWidth: 150 }}>
        {groups.map((g) => (
          <View
            key={g.label}
            style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: g.color,
              }}
            />
            <T muted style={{ fontSize: 10, flex: 1 }}>
              {g.label}
            </T>
            <T weight="semibold" style={{ fontSize: 11 }}>
              {g.n}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

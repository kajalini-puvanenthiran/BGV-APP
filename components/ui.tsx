import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  TextStyle,
  ViewStyle,
  StyleProp,
  TextInputProps,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useStore } from "../lib/store";
import { SafeAreaView } from "react-native-safe-area-context";
export function T({
  children,
  style,
  muted = false,
  weight = "regular",
  ...props
}: {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
  weight?: "regular" | "medium" | "semibold" | "bold" | "heading";
  [key: string]: any;
}) {
  const { palette: p } = useStore();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily:
            weight === "heading"
              ? "Manrope_700Bold"
              : weight === "bold"
                ? "Inter_700Bold"
                : weight === "semibold"
                  ? "Inter_600SemiBold"
                  : weight === "medium"
                    ? "Inter_500Medium"
                    : "Inter_400Regular",
          fontSize: 13,
          color: muted ? p.muted : p.text,
          lineHeight: 20,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Icon({
  name,
  size = 19,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const { palette: p } = useStore();
  return (
    <Ionicons
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      name={name as any}
      size={size}
      color={color || p.muted}
    />
  );
}
export function Button({
  label,
  onPress,
  icon,
  variant = "primary",
  small = false,
  disabled = false,
  testID,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  small?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { palette: p } = useStore();
  const [hover, setHover] = useState(false);
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: small ? 12 : 16,
          height: small ? 34 : 41,
          borderRadius: 7,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: p.border,
          backgroundColor: primary
            ? p.green
            : variant === "danger"
              ? "#552630"
              : variant === "secondary"
                ? p.panel
                : "transparent",
          opacity: disabled ? 0.4 : pressed ? 0.7 : hover ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={small ? 15 : 17}
          color={
            primary ? "#092a20" : variant === "danger" ? "#ffafba" : p.text
          }
        />
      )}
      <T
        weight="semibold"
        style={{
          fontSize: small ? 11 : 12,
          color: primary
            ? "#092a20"
            : variant === "danger"
              ? "#ffafba"
              : p.text,
        }}
      >
        {label}
      </T>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  color,
  size = 19,
}: {
  name: string;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
}) {
  const { palette: p } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        padding: 8,
        borderRadius: 7,
        backgroundColor: hovered ? p.raised : "transparent",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette: p } = useStore();
  return (
    <View
      style={[
        {
          backgroundColor: p.panel,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: p.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Badge({
  label,
  color,
  dot = true,
}: {
  label: string;
  color?: string;
  dot?: boolean;
}) {
  const { palette: p } = useStore();
  const c =
    color ||
    (label === "Completed" || label === "Approved" || label === "Active"
      ? p.green
      : label === "Needs attention" || label === "Rejected"
        ? p.amber
        : label === "In progress" || label === "In review"
          ? p.blue
          : p.muted);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 5,
        backgroundColor: c + "15",
        borderWidth: 1,
        borderColor: c + "20",
      }}
    >
      {dot && (
        <View
          style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c }}
        />
      )}
      <T weight="medium" style={{ color: c, fontSize: 10, lineHeight: 15 }}>
        {label}
      </T>
    </View>
  );
}
export function Avatar({
  name,
  color = "#8b83bd",
  size = 34,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "27",
        borderWidth: 1,
        borderColor: color + "35",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <T weight="semibold" style={{ color, fontSize: size * 0.32 }}>
        {name
          .split(" ")
          .map((x) => x[0])
          .slice(0, 2)
          .join("")}
      </T>
    </View>
  );
}
export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  const { palette: p } = useStore();
  return (
    <View style={{ gap: 7, flex: props.style ? undefined : 1 }}>
      {label && (
        <T weight="medium" style={{ fontSize: 12 }}>
          {label}
        </T>
      )}
      <TextInput
        placeholderTextColor={p.subtle}
        returnKeyType="done"
        {...props}
        style={[
          {
            height: 43,
            borderWidth: 1,
            borderColor: p.border,
            borderRadius: 7,
            paddingHorizontal: 12,
            color: p.text,
            backgroundColor: p.bg,
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            outlineStyle: "none",
          } as any,
          props.style,
        ]}
      />
    </View>
  );
}
export function Search({
  value,
  onChange,
  placeholder = "Search candidates...",
  testID,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  const { palette: p } = useStore();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        backgroundColor: p.bg,
        borderWidth: 1,
        borderColor: p.border,
        borderRadius: 7,
        height: 37,
        paddingHorizontal: 11,
        minWidth: 180,
      }}
    >
      <Icon name="search-outline" size={16} />
      <TextInput
        accessibilityLabel={placeholder}
        testID={testID}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={p.subtle}
        returnKeyType="search"
        style={
          {
            color: p.text,
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            flex: 1,
            outlineStyle: "none",
          } as any
        }
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange("")}
          accessibilityLabel="Clear search"
        >
          <Icon name="close" size={15} />
        </Pressable>
      )}
    </View>
  );
}
// chips 
export function Chips({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { palette: p } = useStore();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item}
          key={item}
          onPress={() => onChange(item)}
          style={{
            paddingHorizontal: 13,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: value === item ? p.greenBg : p.panel,
            borderWidth: 1,
            borderColor: value === item ? p.green + "50" : p.border,
          }}
        >
          <T
            weight={value === item ? "semibold" : "regular"}
            style={{ fontSize: 11, color: value === item ? p.green : p.muted }}
          >
            {item}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
export function Page({
  children,
  refresh = true,
}: {
  children: React.ReactNode;
  refresh?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const { palette: p } = useStore();
  return (
    <FlatList
      style={{ flex: 1, backgroundColor: p.bg }}
      data={[1]}
      keyExtractor={() => "page"}
      renderItem={() => (
        <View
          style={{
            width: "100%",
            maxWidth: 1600,
            alignSelf: "center",
            padding: width < 600 ? 20 : 30,
            paddingBottom: 35,
          }}
        >
          {children}
        </View>
      )}
      refreshControl={
        refresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={p.green}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
          />
        ) : undefined
      }
    />
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { palette: p } = useStore();
  return (
    <View style={{ marginBottom: 26, gap: 8 }}>
      {eyebrow && (
        <T
          weight="medium"
          style={{
            color: p.muted,
            fontSize: 10,
            letterSpacing: 1.5,
            marginBottom: 2,
          }}
        >
          {eyebrow}
        </T>
      )}
      <View
        style={{
          flexDirection: width < 750 ? "column" : "row",
          justifyContent: "space-between",
          alignItems: width < 750 ? "flex-start" : "center",
          gap: 17,
        }}
      >
        <View style={{ flex: 1, gap: 7 }}>
          <T
            accessibilityRole="header"
            weight="heading"
            style={{
              fontSize: width < 600 ? 25 : 29,
              lineHeight: 38,
              letterSpacing: -0.8,
            }}
          >
            {title}
          </T>
          <T muted style={{ fontSize: 12 }}>
            {description}
          </T>
        </View>
        {actions && (
          <View style={{ flexDirection: "row", gap: 9, flexWrap: "wrap" }}>
            {actions}
          </View>
        )}
      </View>
    </View>
  );
}
export function Empty({
  title,
  description,
  icon = "search-outline",
  action,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  const { palette: p } = useStore();
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 10,
      }}
    >
      <View
        style={{
          backgroundColor: p.raised,
          padding: 15,
          borderRadius: 50,
          marginBottom: 4,
        }}
      >
        <Icon name={icon} size={26} />
      </View>
      <T
        accessibilityRole="header"
        weight="semibold"
        style={{ fontSize: 16, textAlign: "center" }}
      >
        {title}
      </T>
      <T muted style={{ textAlign: "center", maxWidth: 380 }}>
        {description}
      </T>
      {action}
    </View>
  );
}
export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  width = 520,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: number;
}) {
  const { palette: p } = useStore();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000000aa",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%", maxWidth: width, maxHeight: "92%", flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: p.panel,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: p.border,
              overflow: "hidden",
            }}
          >
            {/* ── fixed header ── */}
            <View
              style={{
                padding: 24,
                borderBottomWidth: 1,
                borderBottomColor: p.border,
                flexDirection: "row",
                gap: 15,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, gap: 5 }}>
                <T weight="heading" style={{ fontSize: 20, lineHeight: 28 }}>
                  {title}
                </T>
                {description && (
                  <T muted style={{ fontSize: 12 }}>
                    {description}
                  </T>
                )}
              </View>
              <IconButton
                name="close-outline"
                label="Close dialog"
                onPress={onClose}
              />
            </View>
            {/* ── scrollable body ── */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 24 }}
            >
              <View style={{ gap: 20 }}>
                {children}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Rule() {
  const { palette: p } = useStore();
  return <View style={{ height: 1, backgroundColor: p.border }} />;
}
export function Loading() {
  const { palette: p } = useStore();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.bg,
        justifyContent: "center",
        alignItems: "center",
        gap: 14,
      }}
    >
      <ActivityIndicator color={p.green} />
      <T muted>Loading your workspace…</T>
    </View>
  );
}

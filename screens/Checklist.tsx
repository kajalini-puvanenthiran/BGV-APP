import React, { useState } from "react";
import {
  View,
  Pressable,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  Switch,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useStore } from "../lib/store";
import { Check, Upload } from "../lib/data";
import { saveDocument, openDocument, removeDocument } from "../lib/files";
import {
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Badge,
  Search,
  Chips,
  Dialog,
  Field,
  Empty,
  IconButton,
}
  // import the UI components 
  from "../components/ui";
import { CandidateSelectDialog } from "../components/CandidateSelectDialog";
import { DocumentPreviewDialog } from "../components/DocumentPreviewDialog";
import { DocumentEditDialog } from "../components/DocumentEditDialog";
export default function Checklist() {
  const {
    palette: p,
    checks,
    setChecks,
    role,
    uploads,
    setUploads,
    settings,
    toast,
    log,
    selectedCandidate,
    setSelectedCandidate,
    scoped,
    consented,
    setConsented,
    candidates,
    setCandidates,
    selectCandidateAndClient,
    getClientCheckIds,
  } = useStore();
  const { width } = useWindowDimensions();
  const columns = width > 1250 ? 3 : width > 720 ? 2 : 1;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All checks");
  const [busy, setBusy] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState<{
    check: Check;
    requirement: string;
  } | null>(null);
  const [edit, setEdit] = useState<Check | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDocuments, setEditDocuments] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [editRequired, setEditRequired] = useState(true);
  const [editError, setEditError] = useState("");
  const [select, setSelect] = useState(false);
  const [remove, setRemove] = useState<Upload | null>(null);
  const [previewFile, setPreviewFile] = useState<Upload | null>(null);
  const [editDoc, setEditDoc] = useState<Upload | null>(null);
  const candidateId =
    role === "Candidate"
      ? selectedCandidate
      : scoped.some((c) => c.id === selectedCandidate)
        ? selectedCandidate
        : scoped[0]?.id;
  const candidate =
    candidates.find((c) => c.id === candidateId) ||
    scoped.find((c) => c.id === candidateId);
  const clientCheckIds = candidate ? getClientCheckIds(candidate.company) : [];
  const active = checks.filter(
    (c) =>
      c.enabled &&
      (clientCheckIds.length > 0
        ? clientCheckIds.includes(c.id)
        : candidate?.checks.includes(c.id)),
  );
  const assigned = role === "Admin" ? checks : active;
  const categoryOrder = [
    "Identity",
    "Address",
    "Criminal",
    "Financial",
    "Employment",
    "Education",
    "Reference",
    "Health",
  ];
  const distinctCategories = [
    "All checks",
    ...categoryOrder.filter((cat) =>
      assigned.some((c) => c.category === cat),
    ),
    ...Array.from(
      new Set(
        assigned
          .map((c) => c.category)
          .filter((cat) => !categoryOrder.includes(cat)),
      ),
    ),
  ];

  const selectedCategory = distinctCategories.includes(category)
    ? category
    : "All checks";

  const filtered = assigned.filter(
    (c) =>
      (role === "Admin" || c.enabled) &&
      (selectedCategory === "All checks" || c.category === selectedCategory) &&
      (c.title + " " + c.documents.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  // Filter the uploads for the selected candidate 
  const candidateUploads = uploads.filter((u) => u.candidateId === candidateId);
  const total = active.reduce((n, c) => n + c.documents.length, 0);
  const upload = async (
    check: Check,
    requirement: string,
    hasConsent = consented,
  ) => {
    if (!settings.uploads || settings.maintenance || role === "Client") {
      toast("Document uploads are restricted by your administrator.");
      return;
    }
    if (settings.requireConsent && !hasConsent) {
      setPending({ check, requirement });
      setConsent(true);
      return;
    }
    const key = check.id + requirement;
    setBusy(key);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (!file.size || file.size > settings.maxFileSize * 1024 * 1024) {
        toast(
          `Please select a non-empty file smaller than ${settings.maxFileSize} MB.`,
        );
        return;
      }
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
        toast("Only PDF, JPG, and PNG documents are supported.");
        return;
      }
      const id =
        "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      await saveDocument(id, file);
      const previous = candidateUploads.find(
        (u) => u.checkId === check.id && u.requirement === requirement,
      );
      if (previous) await removeDocument(previous.id);
      const record: Upload = {
        id,
        candidateId,
        checkId: check.id,
        requirement,
        name: file.name,
        size: file.size,
        type: file.mimeType || "application/octet-stream",
        uploaded: new Date().toISOString(),
        status: "In review",
      };
      setUploads((us) => [
        ...us.filter(
          (u) =>
            !(
              u.candidateId === candidateId &&
              u.checkId === check.id &&
              u.requirement === requirement
            ),
        ),
        record,
      ]);
      log(
        "Document uploaded",
        `${candidate?.name} · ${requirement}`,
        "cloud-upload-outline",
      );
      toast("Document uploaded and saved on this device.");
    } catch {
      toast("The document could not be uploaded. Check storage and try again.");
    } finally {
      setBusy("");
    }
  };
  const openEdit = (check?: Check) => {
    const c = check || {
      id: "custom-" + Date.now(),
      title: "",
      category: "Identity",
      days: "3–5",
      icon: "document-text-outline",
      color: p.green,
      documents: [],
      enabled: true,
      required: true,
    };
    setEdit(c);
    setEditTitle(c.title);
    setEditDocuments(c.documents.join("\n"));
    setEditEnabled(c.enabled);
    setEditRequired(c.required);
    setEditError("");
  };
  const header = (
    <>
      <PageHeading
        eyebrow="EVERY DOCUMENT. ONE PLACE."
        title={
          role === "Candidate"
            ? "Your next step starts here."
            : "A checklist built for clarity."
        }
        description="The right documents make confident decisions possible."
        actions={
          role === "Admin" ? (
            <Button
              label="Add checklist item"
              icon="add"
              onPress={() => openEdit()}
            />
          ) : undefined
        }
      />
      <Panel style={{ padding: 20, marginBottom: 22 }}>
        <View
          style={{
            flexDirection: width < 650 ? "column" : "row",
            alignItems: width < 650 ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
            <View
              style={{
                backgroundColor: p.greenBg,
                padding: 11,
                borderRadius: 8,
              }}
            >
              <Icon name="documents-outline" color={p.green} size={24} />
            </View>
            <View>
              <T weight="semibold" style={{ fontSize: 14 }}>
                {candidate?.name || "Select a candidate"}’s document checklist
              </T>
              <T muted style={{ fontSize: 11, marginTop: 4 }}>
                {candidateUploads.length} of {total} documents uploaded ·{" "}
                {active.length} active checks
              </T>
            </View>
          </View>
          <Button
            label="Change candidate"
            icon="people-outline"
            variant="secondary"
            small
            onPress={() => setSelect(true)}
          />
        </View>
        <View
          style={{
            height: 5,
            borderRadius: 5,
            backgroundColor: p.border,
            marginTop: 17,
          }}
        >
          <View
            style={{
              height: 5,
              borderRadius: 5,
              backgroundColor: p.green,
              width: `${Math.min(100, (candidateUploads.length / (total || 1)) * 100)}%`,
            }}
          />
        </View>
      </Panel>
      <View
        style={{
          backgroundColor: p.green + "08",
          borderWidth: 1,
          borderColor: p.green + "25",
          padding: 13,
          borderRadius: 7,
          flexDirection: "row",
          gap: 9,
          marginBottom: 22,
        }}
      >
        <Icon name="information-circle-outline" color={p.green} size={17} />
        <T muted style={{ fontSize: 11, flex: 1 }}>
          PDF, JPG, or PNG · Up to {settings.maxFileSize} MB per file. Local
          demo: use sample documents only.{" "}
          {role === "Client"
            ? "Clients have read-only document access."
            : "Files are stored on this device, not sent to a verification provider."}
        </T>
      </View>
      <View style={{ gap: 15, marginBottom: 24 }}>
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search checks or documents..."
        />
        <Chips
          items={distinctCategories}
          value={selectedCategory}
          onChange={setCategory}
        />
      </View>
    </>
  );
  return (
    <>
      <FlatList
        key={columns}
        data={filtered}
        numColumns={columns}
        keyExtractor={(c) => c.id}
        style={{ flex: 1, backgroundColor: p.bg }}
        contentContainerStyle={{
          padding: width < 600 ? 20 : 30,
          maxWidth: 1600,
          width: "100%",
          alignSelf: "center",
          paddingBottom: 40,
        }}
        columnWrapperStyle={columns > 1 ? { gap: 17 } : undefined}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Empty
            title="No checklist items found"
            description="Try another category or search term."
          />
        }
        renderItem={({ item: c }) => (
          <Panel
            style={{
              flex: 1,
              marginBottom: 17,
              maxWidth: columns === 1 ? "100%" : `${100 / columns}%`,
              opacity: c.enabled ? 1 : 0.5,
            }}
          >
            <View style={{ padding: 19, paddingBottom: 15 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    padding: 8,
                    borderRadius: 7,
                    backgroundColor: c.color + "13",
                  }}
                >
                  <Icon name={c.icon} color={c.color} size={21} />
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Badge
                    label={
                      !c.enabled
                        ? "Disabled"
                        : c.required
                          ? "Required"
                          : "Optional"
                    }
                    color={c.required ? p.muted : p.purple}
                    dot={false}
                  />
                  {role === "Admin" && (
                    <IconButton
                      name="create-outline"
                      size={16}
                      label={`Edit ${c.title}`}
                      onPress={() => openEdit(c)}
                    />
                  )}
                </View>
              </View>
              <T
                weight="semibold"
                style={{ fontSize: 14, lineHeight: 21, minHeight: 21 }}
              >
                {c.title}
              </T>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <Icon name="time-outline" size={12} />
                <T muted style={{ fontSize: 10 }}>
                  {c.days} business days · indicative
                </T>
              </View>
            </View>
            <View style={{ padding: 15, paddingTop: 0, gap: 7 }}>
              {c.documents.map((requirement) => {
                const file = candidateUploads.find(
                  (u) => u.checkId === c.id && u.requirement === requirement,
                );
                const isBusy = busy === c.id + requirement;
                return (
                  <View
                    key={requirement}
                    style={{
                      backgroundColor: p.bg + "aa",
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: file ? p.green + "35" : p.border,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={
                        file
                          ? `Download ${file.name}`
                          : `Upload ${requirement} for ${c.title}`
                      }
                      disabled={
                        isBusy ||
                        (!file &&
                          (!settings.uploads ||
                            role === "Client" ||
                            !c.enabled))
                      }
                      onPress={() =>
                        file
                          ? openDocument(file).catch((e) => toast(e.message))
                          : upload(c, requirement)
                      }
                      style={({ hovered }: any) => ({
                        padding: 10,
                        flexDirection: "row",
                        gap: 8,
                        alignItems: "center",
                        backgroundColor: hovered ? p.raised : "transparent",
                        minHeight: 43,
                      })}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={p.green} />
                      ) : (
                        <Icon
                          name={
                            file
                              ? "document-attach-outline"
                              : "cloud-upload-outline"
                          }
                          color={file ? p.green : p.muted}
                          size={16}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <T
                          style={{
                            fontSize: 10,
                            color: file ? p.text : p.muted,
                            lineHeight: 16,
                          }}
                        >
                          {requirement}
                        </T>
                        {file && (
                          <T
                            style={{
                              fontSize: 9,
                              color: p.green,
                              lineHeight: 15,
                            }}
                            numberOfLines={1}
                          >
                            {file.name} · {Math.ceil(file.size / 1024)} KB
                          </T>
                        )}
                      </View>
                      {file && (
                        <Icon
                          name="download-outline"
                          size={14}
                          color={p.green}
                        />
                      )}
                    </Pressable>
                    {file && (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingBottom: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Badge label={file.status} />
                        {role !== "Client" && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${file.name}`}
                            onPress={() => setRemove(file)}
                          >
                            <Icon name="trash-outline" size={13} />
                          </Pressable>
                        )}
                      </View>
                    )}
                    {file?.note && (
                      <T
                        style={{
                          fontSize: 10,
                          color: p.amber,
                          padding: 10,
                          paddingTop: 0,
                        }}
                      >
                        {file.note}
                      </T>
                    )}
                  </View>
                );
              })}
            </View>
            <View
              style={{
                marginTop: "auto",
                paddingHorizontal: 19,
                paddingVertical: 11,
                borderTopWidth: 1,
                borderColor: p.border,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <T muted style={{ fontSize: 9 }}>
                {c.documents.length}{" "}
                {c.documents.length === 1 ? "document" : "documents"}
              </T>
              <T
                style={{
                  fontSize: 9,
                  color:
                    candidateUploads.filter((u) => u.checkId === c.id)
                      .length === c.documents.length
                      ? p.green
                      : p.subtle,
                }}
              >
                {candidateUploads.filter((u) => u.checkId === c.id).length} /{" "}
                {c.documents.length} uploaded
              </T>
            </View>
          </Panel>
        )}
      />
      <Dialog
        visible={consent}
        onClose={() => setConsent(false)}
        title="Your documents, your consent"
        description="Please review before uploading a document."
      >
        <Icon name="shield-checkmark-outline" color={p.green} size={38} />
        <T muted>
          I authorize the collection and review of sample documents for this
          background verification. I understand this is a local demonstration,
          not a completed background screening, and I will not upload sensitive
          personal information.
        </T>
        <T muted style={{ fontSize: 11 }}>
          You can remove documents at any time. Your consent preference is saved
          on this device.
        </T>
        <Button
          label="I agree and continue"
          icon="checkmark"
          onPress={() => {
            setConsented(true);
            setConsent(false);
            if (pending) upload(pending.check, pending.requirement, true);
          }}
        />
      </Dialog>
      <Dialog
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.title ? "Edit checklist item" : "Add checklist item"}
        description="Changes apply across all portals in this workspace."
      >
        <Field
          label="Check name"
          accessibilityLabel="Check name"
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="e.g. Professional membership"
        />
        <Field
          label="Required documents (one per line)"
          accessibilityLabel="Required documents"
          value={editDocuments}
          onChangeText={setEditDocuments}
          multiline
          style={{ height: 130, paddingTop: 12, textAlignVertical: "top" }}
          placeholder={"Membership certificate\nAuthorization form"}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <T>Enable this check</T>
          <Switch
            accessibilityLabel="Enable this check"
            value={editEnabled}
            onValueChange={setEditEnabled}
            trackColor={{ false: p.border, true: p.green }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <T>Required for submission</T>
          <Switch
            accessibilityLabel="Required for submission"
            value={editRequired}
            onValueChange={setEditRequired}
            trackColor={{ false: p.border, true: p.green }}
          />
        </View>
        {!!editError && <T style={{ color: p.danger }}>{editError}</T>}
        <Button
          label="Save checklist item"
          onPress={() => {
            const docs = [
              ...new Set(
                editDocuments
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              ),
            ];
            if (!editTitle.trim() || !docs.length) {
              setEditError(
                "Add a check name and at least one document requirement.",
              );
              return;
            }
            if (edit && role === "Admin") {
              const updated = {
                ...edit,
                title: editTitle.trim(),
                documents: docs,
                enabled: editEnabled,
                required: editRequired,
              };
              setChecks((cs) =>
                cs.some((c) => c.id === edit.id)
                  ? cs.map((c) => (c.id === edit.id ? updated : c))
                  : [...cs, updated],
              );
              if (!checks.some((c) => c.id === edit.id))
                setCandidates((cs) =>
                  cs.map((c) => ({ ...c, checks: [...c.checks, updated.id] })),
                );
              log("Checklist updated", updated.title, "list-outline");
              toast("Checklist updated across the workspace.");
              setEdit(null);
            }
          }}
        />
      </Dialog>
      <CandidateSelectDialog
        visible={select}
        onClose={() => setSelect(false)}
        title="Select candidate for document checklist"
        description="Choose any candidate for their related client. Every candidate is selectable with no default lock."
      />
      <Dialog
        visible={!!remove}
        onClose={() => setRemove(null)}
        title="Remove this document?"
        description={remove?.name}
      >
        <T muted>
          This deletes the saved file from this device. You can upload a
          replacement whenever you are ready.
        </T>
        <View
          style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}
        >
          <Button
            label="Keep document"
            variant="secondary"
            onPress={() => setRemove(null)}
          />
          <Button
            label="Remove document"
            variant="danger"
            onPress={async () => {
              if (remove) {
                try {
                  await removeDocument(remove.id);
                  setUploads((us) => us.filter((u) => u.id !== remove.id));
                  log("Document removed", remove.name, "trash-outline");
                  setRemove(null);
                  toast("Document removed.");
                } catch {
                  toast("Could not remove the document. Try again.");
                }
              }
            }}
          />
        </View>
      </Dialog>
    </>
  );
}

import React, { useState } from "react";
import {
  View,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useStore } from "../lib/store";
import { CaseStatus, Upload, Check } from "../lib/data";
import {
  Page,
  PageHeading,
  T,
  Panel,
  Icon,
  Button,
  Avatar,
  Badge,
  Chips,
  Empty,
  Dialog,
  Field,
  Search,
} from "../components/ui";
import { navigateTo } from "../lib/navigation";
import { openDocument, saveDocument, removeDocument } from "../lib/files";
import { DocumentPreviewDialog } from "../components/DocumentPreviewDialog";
import { DocumentEditDialog } from "../components/DocumentEditDialog";

export default function CaseDetails({ route, navigation }: any) {
  const {
    palette: p,
    scoped,
    candidates,
    checks,
    role,
    uploads,
    setUploads,
    setCandidates,
    settings,
    setSelectedCandidate,
    selectCandidateAndClient,
    getClientCheckIds,
    consented,
    setConsented,
    log,
    toast,
  } = useStore();
  const { width } = useWindowDimensions();

  // Find candidate by route param id
  const candidate =
    candidates.find((c) => c.id === route.params.id) ||
    scoped.find((c) => c.id === route.params.id);

  const [status, setStatus] = useState<CaseStatus>(
    candidate?.status || "Pending",
  );
  const [reject, setReject] = useState<Upload | null>(null);
  const [note, setNote] = useState("");
  const [remove, setRemove] = useState<Upload | null>(null);
  const [busy, setBusy] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState<{
    check: Check;
    requirement: string;
  } | null>(null);
  const [category, setCategory] = useState("All checks");
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<Upload | null>(null);
  const [editFile, setEditFile] = useState<Upload | null>(null);

  if (!candidate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
        <Empty
          title="Case unavailable"
          description="This case is not available to your current portal."
          action={
            <Button
              label="Back to dashboard"
              onPress={() => navigation.goBack()}
            />
          }
        />
      </SafeAreaView>
    );
  }

  // Candidate client checklist items
  const clientCheckIds = getClientCheckIds(candidate.company);
  const clientChecks = checks.filter(
    (c) =>
      c.enabled &&
      (clientCheckIds.length > 0
        ? clientCheckIds.includes(c.id)
        : candidate.checks.includes(c.id)),
  );

  // Uploads filtering for this candidate
  const files = uploads.filter((u) => u.candidateId === candidate.id);
  const totalRequiredDocs = clientChecks.reduce(
    (acc, c) => acc + c.documents.length,
    0,
  );

  // Calculate missing documents across required client checks
  const required = clientChecks.filter((c) => c.required);
  const missing = required.flatMap((c) =>
    c.documents.filter(
      (r) =>
        !files.some(
          (f) =>
            f.checkId === c.id &&
            f.requirement === r &&
            f.status !== "Rejected",
        ),
    ),
  );

  const progressPercent =
    totalRequiredDocs > 0
      ? Math.min(100, Math.round((files.length / totalRequiredDocs) * 100))
      : candidate.progress;

  const updateFile = (
    file: Upload,
    newStatus: Upload["status"],
    message?: string,
  ) => {
    if (role !== "Admin") return;
    setUploads((us) =>
      us.map((u) =>
        u.id === file.id ? { ...u, status: newStatus, note: message } : u,
      ),
    );
    log(
      "Document " + newStatus.toLowerCase(),
      `${candidate.name} · ${file.requirement}`,
      "document-text-outline",
    );
    toast("Document review saved.");
  };

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
      const previous = files.find(
        (u) => u.checkId === check.id && u.requirement === requirement,
      );
      if (previous) await removeDocument(previous.id);
      const record: Upload = {
        id,
        candidateId: candidate.id,
        checkId: check.id,
        requirement,
        name: file.name,
        size: file.size,
        type: file.mimeType || "application/octet-stream",
        uploaded: new Date().toISOString(),
        status: "In review",
      };
      const nextUploads = [
        ...uploads.filter(
          (u) =>
            !(
              u.candidateId === candidate.id &&
              u.checkId === check.id &&
              u.requirement === requirement
            ),
        ),
        record,
      ];
      setUploads(nextUploads);

      // Recalculate progress for candidate
      const candidateFilesCount = nextUploads.filter(
        (u) => u.candidateId === candidate.id,
      ).length;
      const newProgress = Math.min(
        100,
        Math.round((candidateFilesCount / (totalRequiredDocs || 1)) * 100),
      );
      setCandidates((cs) =>
        cs.map((c) =>
          c.id === candidate.id ? { ...c, progress: newProgress } : c,
        ),
      );

      log(
        "Document uploaded",
        `${candidate.name} · ${requirement}`,
        "cloud-upload-outline",
      );
      toast(`Document uploaded and saved for ${candidate.name}.`);
    } catch {
      toast("The document could not be uploaded. Check storage and try again.");
    } finally {
      setBusy("");
    }
  };
  // delete file only 
  const deleteFile = async (file: Upload) => {
    try {
      await removeDocument(file.id);
      const nextUploads = uploads.filter((u) => u.id !== file.id);
      setUploads(nextUploads);

      const candidateFilesCount = nextUploads.filter(
        (u) => u.candidateId === candidate.id,
      ).length;
      const newProgress = Math.min(
        100,
        Math.round((candidateFilesCount / (totalRequiredDocs || 1)) * 100),
      );
      setCandidates((cs) =>
        cs.map((c) =>
          c.id === candidate.id ? { ...c, progress: newProgress } : c,
        ),
      );

      log("Document removed", file.name, "trash-outline");
      setRemove(null);
      toast("Document removed.");
    } catch {
      toast("Could not remove the document. Try again.");
    }
  };
  // open the checklists that have under related case
  const openChecklistWorkspace = () => {
    selectCandidateAndClient(candidate.id);
    navigation.goBack();
    setTimeout(() => navigateTo("Checklist"), 50);
  };

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
      clientChecks.some((c) => c.category === cat),
    ),
    ...Array.from(
      new Set(
        clientChecks
          .map((c) => c.category)
          .filter((cat) => !categoryOrder.includes(cat)),
      ),
    ),
  ];
  // selected category 
  const selectedCategory = distinctCategories.includes(category)
    ? category
    : "All checks";

  // Filter checks by category and search term
  const filteredChecks = clientChecks.filter((c) => {
    const matchesCategory =
      selectedCategory === "All checks" || c.category === selectedCategory;
    const matchesSearch =
      !search ||
      (c.title + " " + c.documents.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View
        style={{
          paddingHorizontal: 25,
          paddingVertical: 13,
          borderBottomWidth: 1,
          borderColor: p.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button
          label="Back to workspace"
          icon="arrow-back"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
        <Badge label={candidate.id} dot={false} />
      </View>
      <Page>
        <PageHeading
          eyebrow="CANDIDATE VERIFICATION"
          title={candidate.name}
          description={`${candidate.position} · ${candidate.company}`}
          actions={
            <Button
              label={role === "Client" ? "View documents" : "Upload documents"}
              icon="documents-outline"
              onPress={openChecklistWorkspace}
            />
          }
        />

        <View
          style={{
            flexDirection: width < 850 ? "column" : "row",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <Panel style={{ padding: 24, flex: 1, gap: 20 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 15 }}
            >
              <Avatar name={candidate.name} color={candidate.color} size={55} />
              <View>
                <T weight="semibold" style={{ fontSize: 17 }}>
                  {candidate.name}
                </T>
                <T muted>{candidate.email}</T>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 28 }}>
              <View style={{ gap: 5 }}>
                <T muted style={{ fontSize: 11 }}>
                  CASE STATUS
                </T>
                <Badge label={candidate.status} />
              </View>
              <View style={{ gap: 5 }}>
                <T muted style={{ fontSize: 11 }}>
                  CLIENT
                </T>
                <T weight="medium">{candidate.company}</T>
              </View>
              <View style={{ gap: 5 }}>
                <T muted style={{ fontSize: 11 }}>
                  CREATED
                </T>
                <T>{candidate.created}</T>
              </View>
            </View>
            <T muted style={{ fontSize: 11 }}>
              Case progress
            </T>
            <View
              style={{ height: 7, borderRadius: 5, backgroundColor: p.border }}
            >
              <View
                style={{
                  height: 7,
                  borderRadius: 5,
                  width: `${candidate.progress}%`,
                  backgroundColor: p.green,
                }}
              />
            </View>
            <T muted style={{ fontSize: 11 }}>
              {candidate.progress}% complete · {files.length} documents
              available on this device
            </T>
          </Panel>

          <Panel style={{ padding: 24, flex: 1, gap: 16 }}>
            <T weight="semibold" style={{ fontSize: 16 }}>
              {role === "Admin"
                ? "Manage verification"
                : "Your verification journey"}
            </T>
            {role === "Admin" ? (
              <>
                <T muted style={{ fontSize: 12 }}>
                  Review the available documents and update this case. Demo
                  cases include illustrative historical progress.
                </T>
                <Chips
                  items={[
                    "Pending",
                    "In progress",
                    "Completed",
                    "Needs attention",
                  ]}
                  value={status}
                  onChange={(v) => setStatus(v as CaseStatus)}
                />
                <Button
                  label="Save case status"
                  disabled={settings.maintenance}
                  onPress={() => {
                    setCandidates((cs) =>
                      cs.map((c) =>
                        c.id === candidate.id
                          ? {
                            ...c,
                            status,
                            progress:
                              status === "Completed"
                                ? 100
                                : status === "Pending"
                                  ? 0
                                  : status === "Needs attention"
                                    ? 42
                                    : 65,
                          }
                          : c,
                      ),
                    );
                    log(
                      "Verification status updated",
                      `${candidate.name} · ${status}`,
                      "shield-checkmark-outline",
                    );
                    toast("Case status updated.");
                  }}
                />
              </>
            ) : (
              <>
                <T muted style={{ fontSize: 12 }}>
                  Your administrator reviews each requirement and shares updates
                  here. Uploading documents does not mean a background check has
                  been completed.
                </T>
                <Badge label={candidate.status} />
                {role === "Candidate" && (
                  <Button
                    label="Submit documents for review"
                    disabled={
                      !!missing.length ||
                      settings.maintenance ||
                      !settings.uploads
                    }
                    onPress={() => {
                      setCandidates((cs) =>
                        cs.map((c) =>
                          c.id === candidate.id
                            ? { ...c, status: "In progress", progress: 50 }
                            : c,
                        ),
                      );
                      log(
                        "Documents submitted for review",
                        candidate.name,
                        "checkmark-circle-outline",
                      );
                      toast("Your documents have been submitted for review.");
                    }}
                  />
                )}
                {role === "Candidate" && (
                  <T muted style={{ fontSize: 11 }}>
                    {missing.length
                      ? `${missing.length} required documents still need to be uploaded.`
                      : "All required documents are ready to submit."}
                  </T>
                )}
              </>
            )}
          </Panel>
        </View>

        {/* Candidate Client Checklist and Document Management Section */}
        <Panel style={{ overflow: "hidden", marginBottom: 25 }}>
          <View
            style={{
              padding: 22,
              borderBottomWidth: 1,
              borderColor: p.border,
              gap: 14,
            }}
          >
            <View
              style={{
                flexDirection: width < 720 ? "column" : "row",
                justifyContent: "space-between",
                alignItems: width < 720 ? "flex-start" : "center",
                gap: 12,
              }}
            >
              <View style={{ gap: 4 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <T weight="semibold" style={{ fontSize: 16 }}>
                    {candidate.company} verification checklist
                  </T>
                  <Badge label={`${clientChecks.length} checks`} dot={false} />
                  <Badge
                    label={`${files.length} / ${totalRequiredDocs} uploaded`}
                    color={p.green}
                    dot={false}
                  />
                </View>
                <T muted style={{ fontSize: 12 }}>
                  Checklist configured for {candidate.company}. Upload
                  candidate documents directly under each check requirement.
                </T>
              </View>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Button
                  label="Open checklist"
                  icon="documents-outline"
                  variant="secondary"
                  small
                  onPress={openChecklistWorkspace}
                />
              </View>
            </View>

            {/* Checklist progress bar */}
            <View style={{ marginTop: 2 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: p.border,
                }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: p.green,
                    width: `${progressPercent}%`,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                }}
              >
                <T muted style={{ fontSize: 11 }}>
                  {progressPercent}% checklist complete
                </T>
                <T muted style={{ fontSize: 11 }}>
                  {totalRequiredDocs - files.length > 0
                    ? `${totalRequiredDocs - files.length} documents remaining`
                    : "All documents uploaded"}
                </T>
              </View>
            </View>

            {/* Filters */}
            <View style={{ gap: 10, marginTop: 4 }}>
              <Search
                value={search}
                onChange={setSearch}
                placeholder="Search checklist items or documents..."
              />
              <Chips
                items={distinctCategories}
                value={selectedCategory}
                onChange={setCategory}
              />
            </View>
          </View>

          {/* Checklist items */}
          {filteredChecks.length === 0 ? (
            <Empty
              icon="documents-outline"
              title="No checklist items match filter"
              description="Try selecting 'All checks' or changing your search query."
              action={
                <Button
                  label="Open checklist"
                  variant="secondary"
                  onPress={openChecklistWorkspace}
                />
              }
            />
          ) : (
            <View style={{ padding: 20, gap: 18 }}>
              {filteredChecks.map((check) => {
                const checkFiles = files.filter((u) => u.checkId === check.id);
                const isComplete =
                  checkFiles.length === check.documents.length &&
                  check.documents.length > 0;
                const isApproved =
                  isComplete &&
                  checkFiles.every((f) => f.status === "Approved");

                return (
                  <View
                    key={check.id}
                    style={{
                      backgroundColor: p.raised + "55",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isComplete ? p.green + "40" : p.border,
                      overflow: "hidden",
                    }}
                  >
                    {/* Check Header */}
                    <View
                      style={{
                        padding: 16,
                        backgroundColor: p.raised,
                        borderBottomWidth: 1,
                        borderColor: p.border,
                        flexDirection: width < 650 ? "column" : "row",
                        alignItems: width < 650 ? "flex-start" : "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            padding: 9,
                            borderRadius: 8,
                            backgroundColor: check.color + "18",
                          }}
                        >
                          <Icon
                            name={check.icon}
                            color={check.color}
                            size={20}
                          />
                        </View>
                        <View>
                          <T weight="semibold" style={{ fontSize: 15 }}>
                            {check.title}
                          </T>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 3,
                            }}
                          >
                            <T muted style={{ fontSize: 11 }}>
                              {check.days} business days · {check.category}
                            </T>
                          </View>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Badge
                          label={
                            isApproved
                              ? "Approved"
                              : isComplete
                                ? "Check complete"
                                : checkFiles.length > 0
                                  ? `${checkFiles.length}/${check.documents.length} uploaded`
                                  : "Pending documents"
                          }
                          color={
                            isApproved
                              ? p.green
                              : isComplete
                                ? p.blue
                                : checkFiles.length > 0
                                  ? p.amber
                                  : p.muted
                          }
                        />
                      </View>
                    </View>

                    {/* Document requirements under this check */}
                    <View style={{ padding: 14, gap: 10 }}>
                      {check.documents.map((requirement) => {
                        const file = checkFiles.find(
                          (f) => f.requirement === requirement,
                        );
                        const isBusy = busy === check.id + requirement;

                        return (
                          <View
                            key={requirement}
                            style={{
                              padding: 14,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: file ? p.green + "35" : p.border,
                              backgroundColor: file ? p.green + "08" : p.bg,
                              flexDirection: width < 720 ? "column" : "row",
                              alignItems:
                                width < 720 ? "flex-start" : "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                flex: 1,
                              }}
                            >
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Preview ${file ? file.name : requirement}`}
                                disabled={!file}
                                onPress={() => file && setPreviewFile(file)}
                                style={{
                                  padding: 8,
                                  borderRadius: 6,
                                  backgroundColor: file
                                    ? p.greenBg
                                    : p.border + "40",
                                }}
                              >
                                <Icon
                                  name={
                                    file
                                      ? "document-text-outline"
                                      : "document-outline"
                                  }
                                  color={file ? p.green : p.muted}
                                  size={18}
                                />
                              </Pressable>
                              <View style={{ flex: 1, gap: 3 }}>
                                <T weight="medium" style={{ fontSize: 13 }}>
                                  {requirement}
                                </T>
                                {file ? (
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel={`Preview ${file.name}`}
                                    onPress={() => setPreviewFile(file)}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <T
                                      style={{
                                        fontSize: 11,
                                        color: p.green,
                                        textDecorationLine: "underline",
                                      }}
                                    >
                                      {file.name}
                                    </T>
                                    <T muted style={{ fontSize: 11 }}>
                                      · {Math.ceil(file.size / 1024)} KB
                                    </T>
                                    <Badge label={file.status} />
                                  </Pressable>
                                ) : (
                                  <T muted style={{ fontSize: 11 }}>
                                    Required document for {candidate.company}
                                  </T>
                                )}
                                {file?.note && (
                                  <T
                                    style={{
                                      color: p.amber,
                                      fontSize: 11,
                                      marginTop: 2,
                                    }}
                                  >
                                    {file.note}
                                  </T>
                                )}
                              </View>
                            </View>

                            {/* Requirement Actions */}
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {file ? (
                                <>
                                  <Button
                                    label="Preview"
                                    icon="eye-outline"
                                    small
                                    variant="secondary"
                                    onPress={() => setPreviewFile(file)}
                                  />
                                  <Button
                                    label="Download"
                                    accessibilityLabel={`Download ${file.name}`}
                                    icon="download-outline"
                                    small
                                    variant="secondary"
                                    onPress={() =>
                                      openDocument(file).catch((e) =>
                                        toast(e.message),
                                      )
                                    }
                                  />
                                  {role !== "Client" && (
                                    <>
                                      <Button
                                        label="Edit"
                                        icon="create-outline"
                                        small
                                        variant="ghost"
                                        onPress={() => setEditFile(file)}
                                      />
                                      <Button
                                        label="Delete"
                                        accessibilityLabel={`Remove ${file.name}`}
                                        icon="trash-outline"
                                        small
                                        variant="danger"
                                        onPress={() => setRemove(file)}
                                      />
                                    </>
                                  )}
                                  {role === "Admin" && (
                                    <>
                                      <Button
                                        label="Approve"
                                        small
                                        onPress={() =>
                                          updateFile(file, "Approved")
                                        }
                                      />
                                      <Button
                                        label="Request changes"
                                        small
                                        variant="secondary"
                                        onPress={() => {
                                          setReject(file);
                                          setNote("");
                                        }}
                                      />
                                    </>
                                  )}
                                </>
                              ) : (
                                role !== "Client" && (
                                  <Button
                                    label="Upload document"
                                    accessibilityLabel={`Upload ${requirement} for ${check.title}`}
                                    icon={
                                      isBusy
                                        ? undefined
                                        : "cloud-upload-outline"
                                    }
                                    small
                                    disabled={
                                      isBusy ||
                                      !settings.uploads ||
                                      settings.maintenance
                                    }
                                    onPress={() => upload(check, requirement)}
                                  />
                                )
                              )}
                              {isBusy && (
                                <ActivityIndicator
                                  size="small"
                                  color={p.green}
                                  style={{ marginLeft: 6 }}
                                />
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Panel>

        {/* Change Request Feedback Dialog */}
        <Dialog
          visible={!!reject}
          onClose={() => setReject(null)}
          title="Request document changes"
          description="Tell the candidate what needs to be updated."
        >
          <Field
            label="Review feedback"
            placeholder="e.g. Please upload a clearer scan of both sides."
            value={note}
            onChangeText={setNote}
            multiline
            style={{ height: 110, paddingTop: 12, textAlignVertical: "top" }}
          />
          <Button
            label="Send feedback"
            disabled={!note.trim()}
            onPress={() => {
              if (reject) {
                updateFile(reject, "Rejected", note.trim());
                setReject(null);
              }
            }}
          />
        </Dialog>

        {/* Consent Dialog */}
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
            not a completed background screening, and I will not upload
            sensitive personal information.
          </T>
          <T muted style={{ fontSize: 11 }}>
            You can remove documents at any time. Your consent preference is
            saved on this device.
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

        {/* Remove Confirmation Dialog */}
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
            style={{
              flexDirection: "row",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <Button
              label="Keep document"
              variant="secondary"
              onPress={() => setRemove(null)}
            />
            <Button
              label="Remove document"
              variant="danger"
              onPress={() => {
                if (remove) deleteFile(remove);
              }}
            />
          </View>
        </Dialog>

        {/* Document Preview Dialog */}
        <DocumentPreviewDialog
          visible={!!previewFile}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onEdit={(f) => setEditFile(f)}
          onDelete={(f) => setRemove(f)}
          onApprove={(f) => updateFile(f, "Approved")}
          onRequestChanges={(f) => {
            setReject(f);
            setNote("");
          }}
          canManage={role !== "Client"}
          isAdmin={role === "Admin"}
        />

        {/* Document Edit Dialog */}
        <DocumentEditDialog
          visible={!!editFile}
          file={editFile}
          onClose={() => setEditFile(null)}
          onSave={(updated) => {
            setUploads((us) =>
              us.map((u) => (u.id === updated.id ? updated : u)),
            );
            if (previewFile?.id === updated.id) {
              setPreviewFile(updated);
            }
          }}
        />
      </Page>
    </SafeAreaView>
  );
}

import React from "react";
import { View } from "react-native";
import { Candidate } from "../lib/data";
import { useStore } from "../lib/store";
import { removeDocument } from "../lib/files";
import { Dialog, Button, T } from "./ui";

export function DeleteCandidateDialog({
  candidate,
  visible,
  onClose,
  onDeleted,
}: {
  candidate: Candidate | null;
  visible: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const {
    palette: p,
    setCandidates,
    candidates,
    uploads,
    setUploads,
    selectedCandidate,
    setSelectedCandidate,
    log,
    toast,
  } = useStore();

  if (!candidate) return null;

  const candidateUploads = uploads.filter((u) => u.candidateId === candidate.id);

  const handleDelete = async () => {
    try {
      for (const file of candidateUploads) {
        try {
          await removeDocument(file.id);
        } catch {}
      }
      setUploads((prev) => prev.filter((u) => u.candidateId !== candidate.id));
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));

      if (selectedCandidate === candidate.id) {
        const remaining = candidates.filter((c) => c.id !== candidate.id);
        if (remaining.length > 0) {
          setSelectedCandidate(remaining[0].id);
        }
      }

      log("Candidate deleted", `${candidate.name} (${candidate.id})`, "trash-outline", p.danger);
      toast(`Candidate case "${candidate.name}" has been deleted.`);
      onDeleted?.();
      onClose();
    } catch {
      toast("Could not delete candidate case. Please try again.");
    }
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Delete candidate verification?"
      description={`${candidate.name} · ${candidate.id}`}
    >
      <T muted style={{ fontSize: 13, lineHeight: 20 }}>
        Are you sure you want to permanently delete this candidate case? This will remove all verification records and delete any uploaded documents ({candidateUploads.length} files) from this device.
      </T>

      <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Button label="Cancel" variant="secondary" onPress={onClose} />
        <Button
          label="Delete candidate"
          variant="danger"
          icon="trash-outline"
          onPress={handleDelete}
        />
      </View>
    </Dialog>
  );
}

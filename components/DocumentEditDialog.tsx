import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Dialog, Button, Field, T, Icon } from "./ui";
import { Upload } from "../lib/data";
import { saveDocument, removeDocument } from "../lib/files";
import { useStore } from "../lib/store";

export function DocumentEditDialog({
  visible,
  file,
  onClose,
  onSave,
}: {
  visible: boolean;
  file: Upload | null;
  onClose: () => void;
  onSave: (updated: Upload) => void;
}) {
  const { palette: p, settings, toast, log } = useStore();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setNote(file.note || "");
    }
  }, [file]);

  if (!file) return null;

  const handleReplace = async () => {
    setReplacing(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.size || asset.size > settings.maxFileSize * 1024 * 1024) {
        toast(`File size must be under ${settings.maxFileSize} MB.`);
        return;
      }
      if (!/\.(pdf|jpe?g|png)$/i.test(asset.name)) {
        toast("Only PDF, JPG, and PNG documents are supported.");
        return;
      }
      // Save new file
      const newId =
        "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      await saveDocument(newId, asset);
      // Remove old file
      await removeDocument(file.id);

      const updated: Upload = {
        ...file,
        id: newId,
        name: asset.name,
        size: asset.size,
        type: asset.mimeType || "application/octet-stream",
        uploaded: new Date().toISOString(),
        status: "In review",
      };
      setName(asset.name);
      onSave(updated);
      log("Document replaced", `${file.requirement} · ${asset.name}`);
      toast("Attachment replaced with new file.");
    } catch {
      toast("Could not replace document. Try again.");
    } finally {
      setReplacing(false);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast("File name cannot be empty.");
      return;
    }
    const updated: Upload = {
      ...file,
      name: trimmed,
      note: note.trim() || undefined,
    };
    onSave(updated);
    toast("Document details updated.");
    onClose();
  };

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="Edit document"
      description={`Update attachment details or replace file for ${file.requirement}`}
    >
      <View style={{ gap: 14 }}>
        <Field
          label="File name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Identity_Card.png"
        />

        <Field
          label="Notes / Comments (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Valid until 2029"
          multiline
          style={{ height: 80, paddingTop: 10, textAlignVertical: "top" }}
        />

        {/* Replace attachment action */}
        <View
          style={{
            padding: 14,
            backgroundColor: p.raised,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.border,
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="cloud-upload-outline" color={p.green} size={18} />
            <T weight="medium" style={{ fontSize: 13 }}>
              Replace file attachment
            </T>
          </View>
          <T muted style={{ fontSize: 11 }}>
            Current size: {Math.ceil(file.size / 1024)} KB · Uploaded on{" "}
            {new Date(file.uploaded).toLocaleDateString()}
          </T>
          <Button
            label={replacing ? "Selecting file..." : "Choose new file"}
            icon="document-attach-outline"
            variant="secondary"
            small
            disabled={replacing || !settings.uploads || settings.maintenance}
            onPress={handleReplace}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 6,
          }}
        >
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button label="Save changes" onPress={handleSave} />
        </View>
      </View>
    </Dialog>
  );
}

import React, { useEffect, useState } from "react";
import { View, Image, Platform, ActivityIndicator } from "react-native";
import { Dialog, Button, Badge, T, Icon } from "./ui";
import { Upload } from "../lib/data";
import { getDocumentUrl, openDocument } from "../lib/files";
import { useStore } from "../lib/store";

export function DocumentPreviewDialog({
  visible,
  file,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  onRequestChanges,
  canManage = true,
  isAdmin = false,
}: {
  visible: boolean;
  file: Upload | null;
  onClose: () => void;
  onEdit?: (file: Upload) => void;
  onDelete?: (file: Upload) => void;
  onApprove?: (file: Upload) => void;
  onRequestChanges?: (file: Upload) => void;
  canManage?: boolean;
  isAdmin?: boolean;
}) {
  const { palette: p, toast } = useStore();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible && file) {
      setLoading(true);
      setError("");
      getDocumentUrl(file)
        .then((previewUrl) => {
          setUrl(previewUrl);
        })
        .catch((e) => {
          setError(e.message || "Failed to load document preview.");
        })
        .finally(() => setLoading(false));
    } else {
      setUrl(null);
      setError("");
    }
  }, [visible, file]);

  if (!file) return null;

  const isImage =
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name) ||
    file.type.startsWith("image/");
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title={file.requirement}
      description={`${file.name} · ${Math.ceil(file.size / 1024)} KB`}
    >
      <View style={{ gap: 14 }}>
        {/* Document metadata chips */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderColor: p.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Badge label={file.status} />
            <T muted style={{ fontSize: 11 }}>
              {new Date(file.uploaded).toLocaleDateString()}
            </T>
          </View>
          <T muted style={{ fontSize: 11 }}>
            {file.type || "Document"}
          </T>
        </View>

        {/* Note if rejected or changes requested */}
        {file.note && (
          <View
            style={{
              padding: 10,
              backgroundColor: p.amber + "15",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: p.amber + "30",
            }}
          >
            <T style={{ color: p.amber, fontSize: 11 }}>
              Review Feedback: {file.note}
            </T>
          </View>
        )}

        {/* Preview content */}
        <View
          style={{
            minHeight: 220,
            maxHeight: 460,
            backgroundColor: p.raised,
            borderRadius: 8,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: p.border,
          }}
        >
          {loading ? (
            <View style={{ padding: 40, alignItems: "center", gap: 12 }}>
              <ActivityIndicator size="large" color={p.green} />
              <T muted style={{ fontSize: 12 }}>
                Loading preview...
              </T>
            </View>
          ) : error ? (
            <View style={{ padding: 30, alignItems: "center", gap: 10 }}>
              <Icon name="alert-circle-outline" size={32} color={p.danger} />
              <T style={{ color: p.danger, textAlign: "center" }}>{error}</T>
              <Button
                label="Download file instead"
                small
                variant="secondary"
                onPress={() =>
                  openDocument(file).catch((e) => toast(e.message))
                }
              />
            </View>
          ) : isImage && url ? (
            <Image
              source={{ uri: url }}
              style={{
                width: "100%",
                height: 380,
                resizeMode: "contain",
                backgroundColor: "#00000020",
              }}
            />
          ) : isPdf && url && Platform.OS === "web" ? (
            <iframe
              src={url}
              style={{
                width: "100%",
                height: 420,
                border: "none",
                borderRadius: 8,
              }}
              title={file.name}
            />
          ) : (
            <View
              style={{
                padding: 40,
                alignItems: "center",
                gap: 12,
                maxWidth: 400,
              }}
            >
              <View
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: p.greenBg,
                }}
              >
                <Icon
                  name={isPdf ? "document-text" : "document-attach"}
                  size={44}
                  color={p.green}
                />
              </View>
              <T weight="medium" style={{ textAlign: "center", fontSize: 14 }}>
                {file.name}
              </T>
              <T muted style={{ textAlign: "center", fontSize: 11 }}>
                PDF and binary documents can be downloaded or opened directly.
              </T>
              <Button
                label="Download to view full document"
                icon="download-outline"
                variant="secondary"
                small
                onPress={() =>
                  openDocument(file).catch((e) => toast(e.message))
                }
              />
            </View>
          )}
        </View>

        {/* Actions Toolbar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: p.border,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              label="Download"
              icon="download-outline"
              variant="secondary"
              small
              onPress={() =>
                openDocument(file).catch((e) => toast(e.message))
              }
            />
            {canManage && onEdit && (
              <Button
                label="Edit"
                icon="create-outline"
                variant="ghost"
                small
                onPress={() => {
                  onClose();
                  onEdit(file);
                }}
              />
            )}
            {canManage && onDelete && (
              <Button
                label="Delete"
                icon="trash-outline"
                variant="danger"
                small
                onPress={() => {
                  onClose();
                  onDelete(file);
                }}
              />
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {isAdmin && onApprove && (
              <Button
                label="Approve"
                small
                onPress={() => {
                  onApprove(file);
                  onClose();
                }}
              />
            )}
            {isAdmin && onRequestChanges && (
              <Button
                label="Request changes"
                variant="secondary"
                small
                onPress={() => {
                  onClose();
                  onRequestChanges(file);
                }}
              />
            )}
            <Button
              label="Close"
              variant="secondary"
              small
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Dialog>
  );
}

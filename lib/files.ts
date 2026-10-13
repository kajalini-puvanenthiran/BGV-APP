import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { DocumentPickerAsset } from "expo-document-picker";
import type { Upload } from "./data";
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("bgv-document-vault", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveDocument(id: string, asset: DocumentPickerAsset) {
  if (Platform.OS === "web") {
    const blob = asset.file || (await (await fetch(asset.uri)).blob());
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const t = database.transaction("files", "readwrite");
      t.objectStore("files").put(blob, id);
      t.oncomplete = () => {
        database.close();
        resolve();
      };
      t.onerror = () => reject(t.error);
    });
  } else {
    const dir = FileSystem.documentDirectory + "vault/";
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    await FileSystem.copyAsync({ from: asset.uri, to: dir + id });
  }
}
export async function openDocument(file: Upload) {
  if (Platform.OS === "web") {
    const database = await db();
    const blob = await new Promise<Blob>((resolve, reject) => {
      const req = database
        .transaction("files")
        .objectStore("files")
        .get(file.id);
      req.onsuccess = () =>
        req.result
          ? resolve(req.result)
          : reject(
              new Error(
                "This file is no longer available on this device. Please upload it again.",
              ),
            );
      req.onerror = () => reject(req.error);
    });
    database.close();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    await Sharing.shareAsync(
      FileSystem.documentDirectory + "vault/" + file.id,
      { mimeType: file.type, dialogTitle: file.name },
    );
  }
}
export async function getDocumentUrl(file: Upload): Promise<string> {
  if (Platform.OS === "web") {
    const database = await db();
    const blob = await new Promise<Blob>((resolve, reject) => {
      const req = database
        .transaction("files")
        .objectStore("files")
        .get(file.id);
      req.onsuccess = () =>
        req.result
          ? resolve(req.result)
          : reject(
              new Error(
                "This file is no longer available on this device. Please upload it again.",
              ),
            );
      req.onerror = () => reject(req.error);
    });
    database.close();
    return URL.createObjectURL(blob);
  } else {
    return FileSystem.documentDirectory + "vault/" + file.id;
  }
}
export async function removeDocument(id: string) {
  if (Platform.OS === "web") {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const t = database.transaction("files", "readwrite");
      t.objectStore("files").delete(id);
      t.oncomplete = () => {
        database.close();
        resolve();
      };
      t.onerror = () => reject(t.error);
    });
  } else
    await FileSystem.deleteAsync(FileSystem.documentDirectory + "vault/" + id, {
      idempotent: true,
    });
}
export async function exportText(
  name: string,
  content: string,
  type = "text/csv",
) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    const uri = FileSystem.cacheDirectory + name;
    await FileSystem.writeAsStringAsync(uri, content);
    await Sharing.shareAsync(uri, { mimeType: type, dialogTitle: name });
  }
}
export function csvValue(value: string | number) {
  const text = String(value);
  return (
    '"' +
    (/^[=+@\-\t\r]/.test(text) ? "'" : "") +
    text.replace(/"/g, '""') +
    '"'
  );
}

import { createNavigationContainerRef } from "@react-navigation/native";
export const navigationRef = createNavigationContainerRef<any>();
export function navigateTo(screen: string) {
  if (navigationRef.isReady()) navigationRef.navigate("Workspace", { screen });
}
export function openCase(id: string) {
  if (navigationRef.isReady()) navigationRef.navigate("CaseDetails", { id });
}

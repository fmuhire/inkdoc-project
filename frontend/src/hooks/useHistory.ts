import { useSyncExternalStore } from "react";
import { getDocs, subscribe, type HistoryDoc } from "../lib/storage";

export function useHistory(): HistoryDoc[] {
  return useSyncExternalStore(subscribe, getDocs);
}

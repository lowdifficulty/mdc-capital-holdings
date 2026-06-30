"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getQuiverSyncError,
  isQuiverSyncing,
  resumeQuiverSyncIfNeeded,
  startQuiverSync,
  subscribeQuiverSync,
  subscribeQuiverSyncComplete,
} from "@/lib/dashboard/quiverSync";

export function useQuiverSync() {
  const [syncing, setSyncing] = useState(isQuiverSyncing());
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(getQuiverSyncError());

  useEffect(() => {
    const unsubSync = subscribeQuiverSync(setSyncing);
    const unsubDone = subscribeQuiverSyncComplete(() => {
      setRefreshToken((t) => t + 1);
      setError(getQuiverSyncError());
    });
    void resumeQuiverSyncIfNeeded();
    return () => {
      unsubSync();
      unsubDone();
    };
  }, []);

  const startSync = useCallback(async () => {
    setError(null);
    try {
      await startQuiverSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }, []);

  return { syncing, startSync, refreshToken, syncError: error };
}

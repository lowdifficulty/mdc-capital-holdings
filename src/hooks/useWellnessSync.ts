"use client";

import { useEffect, useState } from "react";
import {
  getWellnessSyncState,
  hydrateWellnessFromServer,
  initWellnessClientSync,
  subscribeWellnessSync,
} from "@/lib/wellness/clientSync";

export function useWellnessSync() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [{ state, error }, setSyncState] = useState(getWellnessSyncState());

  useEffect(() => {
    initWellnessClientSync();
    void hydrateWellnessFromServer().then(() => {
      setSyncState(getWellnessSyncState());
      setRefreshToken((token) => token + 1);
    });

    const unsub = subscribeWellnessSync(() => {
      setSyncState(getWellnessSyncState());
      setRefreshToken((token) => token + 1);
    });

    const onFocus = () => {
      void hydrateWellnessFromServer().then(() => {
        setSyncState(getWellnessSyncState());
        setRefreshToken((token) => token + 1);
      });
    };
    window.addEventListener("focus", onFocus);

    return () => {
      unsub();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return { refreshToken, syncState: state, syncError: error };
}

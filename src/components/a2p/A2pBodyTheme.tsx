"use client";

import { useEffect } from "react";

/** Syncs document body theme so global dark body styles do not wash out A2P pages. */
export default function A2pBodyTheme() {
  useEffect(() => {
    document.body.classList.add("site-a2p-mode");
    return () => document.body.classList.remove("site-a2p-mode");
  }, []);
  return null;
}

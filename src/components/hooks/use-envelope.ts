"use client";

import { apiRequest } from "@/lib/api";
import type { Envelope } from "@/types/envelope";
import { useCallback, useEffect, useState } from "react";

interface Snapshot {
  path: string | null;
  envelope: Envelope | null;
}

export function useEnvelope(path: string | null, options?: { redirectOnUnauthorized?: boolean }) {
  const redirectOnUnauthorized = options?.redirectOnUnauthorized;
  const [snapshot, setSnapshot] = useState<Snapshot>({ path: null, envelope: null });

  const reload = useCallback(async () => {
    if (!path) return null;
    const next = await apiRequest(path, { redirectOnUnauthorized });
    setSnapshot({ path, envelope: next });
    return next;
  }, [path, redirectOnUnauthorized]);

  useEffect(() => {
    if (!path) return;
    let active = true;
    apiRequest(path, { redirectOnUnauthorized }).then((envelope) => {
      if (!active) return;
      setSnapshot({ path, envelope });
    });
    return () => {
      active = false;
    };
  }, [path, redirectOnUnauthorized]);

  const ready = snapshot.path === path;
  return {
    envelope: ready ? snapshot.envelope : null,
    loading: Boolean(path) && !ready,
    reload,
  };
}

export function useDebounced(value: string, delay = 1000): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), value.trim().length === 0 ? 0 : delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

"use client";
import { useEffect } from "react";
import { initClientErrorTracker } from "@/lib/telemetry";

export function GlobalTelemetryListener() {
  useEffect(() => {
    initClientErrorTracker();
  }, []);

  return null;
}

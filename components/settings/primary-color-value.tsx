"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const readColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--hospital-green").trim();
const readServerColor = () => "";

export function PrimaryColorValue() {
  const color = useSyncExternalStore(subscribe, readColor, readServerColor);

  return <span className="text-hospital-text-muted">{color}</span>;
}

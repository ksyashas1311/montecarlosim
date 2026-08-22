"use client";

import { useSyncExternalStore } from "react";
import { planStore, PlanState } from "../store/planStore";

export function usePlanStore(): PlanState {
  return useSyncExternalStore(
    planStore.subscribe,
    planStore.getState,
    planStore.getState
  );
}

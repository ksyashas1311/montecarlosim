"use client";

import { usePlanStore } from "./usePlanStore";
import { planStore } from "../store/planStore";

export function useOnboardingState() {
  const store = usePlanStore();

  return {
    isOnboarded: store.isOnboarded,
    setIsOnboarded: (onboarded: boolean) => planStore.setIsOnboarded(onboarded),
    loadDemoData: () => planStore.loadDemoData(),
  };
}

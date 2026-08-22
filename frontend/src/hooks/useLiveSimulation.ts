"use client";

import { useMemo, useState, useEffect } from "react";
import { usePlanStore } from "./usePlanStore";
import { computeClientSimulation, UserProfile, AssetAllocation, Goal, LifeEvent } from "../store/planStore";

export function useLiveSimulation() {
  const store = usePlanStore();

  /**
   * Preview the simulation outcome of hypothetical changes before committing
   */
  const previewSimulation = (
    partialProfile?: Partial<UserProfile>,
    partialAssets?: Partial<AssetAllocation>,
    customGoals?: Goal[],
    customEvents?: LifeEvent[]
  ) => {
    const testProfile = { ...store.profile, ...partialProfile };
    const testAssets = { ...store.assets, ...partialAssets };
    const testGoals = customGoals || store.goals;
    const testEvents = customEvents || store.lifeEvents;

    const result = computeClientSimulation(
      testProfile,
      testAssets,
      testGoals,
      testEvents,
      store.liabilities,
      store.marketModel
    );

    const currentScore = store.simulation?.health_score ?? 78;
    const projectedScore = result.health_score;
    const scoreDiff = projectedScore - currentScore;

    return {
      result,
      currentScore,
      projectedScore,
      scoreDiff,
      formattedDelta: scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`,
    };
  };

  return {
    simulation: store.simulation,
    isSimulating: store.isSimulating,
    lastSimulatedAt: store.lastSimulatedAt,
    previewSimulation,
  };
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const AVAILABLE_SETS = [
  "U2021",
  "U2020",
  "U2019",
  "U2018",
  "U2017",
  "U2022",
  "U2023",
] as const;

export type AcademicSet = (typeof AVAILABLE_SETS)[number] | string;

interface AdviserState {
  selectedSet: AcademicSet;
  availableSets: string[];
  setSelectedSet: (set: string) => void;
  setAvailableSets: (sets: string[]) => void;
}

export const useAdviserStore = create<AdviserState>()(
  persist(
    (set) => ({
      selectedSet: "U2021",
      availableSets: [...AVAILABLE_SETS],
      setSelectedSet: (selectedSet: string) => set({ selectedSet }),
      setAvailableSets: (availableSets: string[]) => set({ availableSets }),
    }),
    {
      name: "gradelis.adviser-store",
    }
  )
);

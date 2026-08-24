"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/shared/icons/ui-icons";
import { useAdviserStore } from "@/features/adviser/store/adviser-store";

export function SessionSelect() {
  const { selectedSet, availableSets, setSelectedSet } = useAdviserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeDisplay = mounted ? selectedSet : "U2021";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-11 min-w-28 items-center justify-between gap-2.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2e63e5]/20"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Academic Set"
      >
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#2e63e5]" />
          <span>{activeDisplay}</span>
        </span>
        <ChevronDownIcon
          className={`size-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Advising Set
          </div>
          <div className="max-h-56 overflow-y-auto">
            {availableSets.map((setOption) => {
              const isSelected = setOption === selectedSet;
              return (
                <button
                  key={setOption}
                  type="button"
                  onClick={() => {
                    setSelectedSet(setOption);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "bg-[#2e63e5] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{setOption}</span>
                  {isSelected && (
                    <span className="text-xs font-bold text-white">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

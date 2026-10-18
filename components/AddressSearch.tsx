"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import {
  hydrateCollectionProfile,
  profileToAutocompleteItem,
  type AddressAutocompleteItem,
} from "@/lib/arcgis";
import { searchCollectionProfiles } from "@/lib/esd";
import type { CollectionProfile } from "@/lib/schedule";

interface AddressSearchProps {
  profiles: CollectionProfile[];
  selectedProfile?: CollectionProfile | null;
  onSelectProfile: (profile: CollectionProfile) => void;
  onScheduleLoadingChange?: (isLoading: boolean) => void;
  onClear?: () => void;
}

export default function AddressSearch({
  profiles,
  selectedProfile = null,
  onSelectProfile,
  onScheduleLoadingChange,
  onClear,
}: AddressSearchProps) {
  // Null means the input shows the currently selected address (or empty if none);
  // a string means the user is actively typing a search query.
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  const [remoteCompletions, setRemoteCompletions] = useState<
    AddressAutocompleteItem[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [noMatch, setNoMatch] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scheduleAbortRef = useRef<AbortController | null>(null);

  const inputValue = draftQuery ?? selectedProfile?.address ?? "";
  const trimmedDraft = draftQuery !== null ? draftQuery.trim() : "";
  // Autocomplete ONLY activates while the user is actively typing >= 2 characters
  const isTyping = draftQuery !== null && trimmedDraft.length >= 2;

  const localCompletions = useMemo(() => {
    if (!isTyping) return [];
    return searchCollectionProfiles(profiles, trimmedDraft, 5).map((p) =>
      profileToAutocompleteItem(p)
    );
  }, [isTyping, profiles, trimmedDraft]);

  // Merge live City of San Diego GIS locator completions with local matches
  const completions = useMemo(() => {
    if (!isTyping) return [];
    const seen = new Set<string>();
    const merged: AddressAutocompleteItem[] = [];

    for (const item of [...remoteCompletions, ...localCompletions]) {
      const key = item.streetAddress.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
      if (merged.length >= 6) break;
    }
    return merged;
  }, [isTyping, remoteCompletions, localCompletions]);

  // Inline ghost-text completion when the top match starts with the user's typed prefix
  const ghostCompletion = useMemo(() => {
    if (!isTyping || !draftQuery) return "";
    const top = completions[activeIndex] ?? completions[0];
    if (!top) return "";

    const raw = draftQuery;
    if (top.address.toLowerCase().startsWith(raw.toLowerCase())) {
      return raw + top.address.slice(raw.length);
    }
    if (top.streetAddress.toLowerCase().startsWith(raw.toLowerCase())) {
      return raw + top.streetAddress.slice(raw.length);
    }
    return "";
  }, [isTyping, draftQuery, completions, activeIndex]);

  useEffect(() => {
    if (!isTyping) {
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmedDraft)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          completions?: AddressAutocompleteItem[];
        };
        if (!controller.signal.aborted && Array.isArray(data.completions)) {
          setRemoteCompletions(
            data.completions.map((item) => ({
              ...item,
              profile: item.profile
                ? hydrateCollectionProfile(item.profile)
                : undefined,
            }))
          );
        }
      } catch {
        // Ignore aborted requests or offline fallback
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isTyping, trimmedDraft]);

  async function fetchLiveScheduleForAddress(
    address: string,
    magicKey?: string
  ): Promise<boolean> {
    scheduleAbortRef.current?.abort();
    const controller = new AbortController();
    scheduleAbortRef.current = controller;

    setIsSearching(true);
    onScheduleLoadingChange?.(true);
    try {
      const params = new URLSearchParams({ address });
      if (magicKey) {
        params.set("magicKey", magicKey);
      }
      const res = await fetch(`/api/schedule?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { profile?: CollectionProfile };
      if (!controller.signal.aborted && data.profile) {
        onSelectProfile(hydrateCollectionProfile(data.profile));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
        onScheduleLoadingChange?.(false);
      }
    }
  }

  async function commitAutocompleteItem(item: AddressAutocompleteItem) {
    setDraftQuery(null);
    setRemoteCompletions([]);
    setNoMatch(false);
    setActiveIndex(0);

    if (item.profile) {
      onSelectProfile(hydrateCollectionProfile(item.profile));
    }

    // Always pull the live pickup schedule from /api/schedule for the chosen address
    await fetchLiveScheduleForAddress(item.address, item.magicKey);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = inputValue.trim();
    if (!q) return;

    const chosen = completions[activeIndex] ?? completions[0];
    if (chosen) {
      await commitAutocompleteItem(chosen);
      return;
    }

    setDraftQuery(null);
    setRemoteCompletions([]);
    setNoMatch(false);

    const found = await fetchLiveScheduleForAddress(q);
    if (!found) {
      setNoMatch(true);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isTyping) {
      if (event.key === "Escape") {
        setDraftQuery(null);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (completions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % completions.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (completions.length > 0) {
        setActiveIndex(
          (prev) => (prev - 1 + completions.length) % completions.length
        );
      }
    } else if (event.key === "Escape") {
      setDraftQuery(null);
      setRemoteCompletions([]);
    } else if (
      (event.key === "Tab" || event.key === "ArrowRight") &&
      completions.length > 0
    ) {
      const top = completions[activeIndex] ?? completions[0];
      const inputEl = event.currentTarget;
      const isCursorAtEnd =
        inputEl.selectionStart === inputValue.length &&
        inputEl.selectionEnd === inputValue.length;

      if (
        top &&
        (event.key === "Tab" || isCursorAtEnd) &&
        top.address.toLowerCase() !== inputValue.toLowerCase()
      ) {
        event.preventDefault();
        void commitAutocompleteItem(top);
      }
    }
  }

  return (
    <section aria-label="Address lookup" className="space-y-2.5">
      <div className="relative">
        <form
          role="search"
          onSubmit={handleSubmit}
          className="group relative rounded-2xl border-2 border-flip-teal/30 bg-white shadow-xs transition-all focus-within:border-flip-teal focus-within:ring-4 focus-within:ring-flip-teal/20"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-flip-teal/15 text-flip-teal transition-colors group-focus-within:bg-flip-teal group-focus-within:text-white"
          >
            <Search className="h-4 w-4" />
          </span>

          {/* Inline Ghost-Text Autocomplete Overlay */}
          {ghostCompletion && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded-2xl border border-transparent pl-13 pr-10 text-[15px] font-medium"
            >
              <span className="invisible">{inputValue}</span>
              <span className="text-flip-slate/40">
                {ghostCompletion.slice(inputValue.length)}
              </span>
            </div>
          )}

          <input
            type="search"
            role="combobox"
            aria-expanded={isTyping && completions.length > 0}
            aria-haspopup="listbox"
            aria-controls="esd-address-listbox"
            aria-activedescendant={
              isTyping && completions[activeIndex]
                ? `address-completion-${activeIndex}`
                : undefined
            }
            aria-autocomplete="both"
            value={inputValue}
            onBlur={() => {
              // Delay resetting draft state so completion clicks register cleanly
              setTimeout(() => {
                setRemoteCompletions([]);
              }, 140);
            }}
            onChange={(e) => {
              const nextVal = e.target.value;
              setDraftQuery(nextVal);
              if (nextVal.trim().length < 2) {
                setRemoteCompletions([]);
                setIsSearching(false);
              }
              setActiveIndex(0);
              setNoMatch(false);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Enter City of San Diego street address to view pickup and street sweeping schedule"
            title="Enter City of San Diego street address to view pickup and street sweeping schedule"
            aria-describedby={noMatch ? "address-search-status" : undefined}
            autoComplete="off"
            className="relative h-14 w-full rounded-2xl bg-transparent pl-13 pr-10 text-[15px] font-semibold text-flip-dark placeholder:text-flip-slate/60 focus:outline-hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />

          {isSearching ? (
            <Loader2
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-flip-teal"
              aria-hidden="true"
            />
          ) : (
            inputValue && (
              <button
                type="button"
                aria-label="Clear address search"
                onClick={() => {
                  setDraftQuery("");
                  setRemoteCompletions([]);
                  setNoMatch(false);
                  setActiveIndex(0);
                  onClear?.();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-flip-slate/60 transition-colors hover:bg-flip-teal/15 hover:text-flip-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )
          )}
        </form>

        {/* Screen Reader Live Region for Autocomplete Completions */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isTyping && completions.length > 0
            ? `${completions.length} address suggestions available. Use up and down arrows to review.`
            : ""}
        </div>

        {isTyping && completions.length > 0 && (
          <ul
            id="esd-address-listbox"
            role="listbox"
            aria-label="Address autocomplete completions"
            className="absolute left-0 right-0 z-30 mt-2 divide-y divide-flip-teal/10 overflow-hidden rounded-2xl border-2 border-flip-teal/30 bg-white shadow-xl"
          >
            {completions.map((item, idx) => {
              const isHighlighted = idx === activeIndex;
              return (
                <li
                  key={`${item.id}-${idx}`}
                  id={`address-completion-${idx}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void commitAutocompleteItem(item);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex cursor-pointer items-center gap-2.5 px-4 py-3 text-sm transition-colors ${
                    isHighlighted
                      ? "bg-flip-tealBG text-flip-tealDark font-bold"
                      : "bg-transparent hover:bg-flip-tealBG/60 text-flip-dark font-medium"
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${
                      isHighlighted ? "text-flip-teal" : "text-flip-tealLight"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {item.address}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {noMatch && (
        <p
          id="address-search-status"
          role="status"
          className="rounded-xl border border-cc-magenta/60 bg-cc-magenta/15 px-3.5 py-2.5 text-sm font-medium text-cc-bone"
        >
          Address not found.
        </p>
      )}
    </section>
  );
}

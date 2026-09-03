"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { boons, hammers, aspects, duos, keepsakeSlot, wares } from "@/data";

const ALL = [
  ...boons,
  ...duos,
  ...hammers,
  ...aspects,
  ...keepsakeSlot,
  ...wares,
];

const KIND_LABEL = {
  boon: "Boon",
  duo: "Duo",
  hammer: "Hammer",
  aspect: "Aspect",
  keepsake: "Keepsake",
  companion: "Companion",
  ware: "Ware",
};

/** Toolbar search: type, arrow, Enter to add. Ctrl+K focuses it. */
export default function QuickSearch({ onPick }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const item of ALL) {
      const t = item.title.toLowerCase();
      if (t.startsWith(q)) starts.push(item);
      else if (t.includes(q)) contains.push(item);
    }
    return [...starts, ...contains].slice(0, 8); // prefix matches first
  }, [query]);

  function choose(item) {
    if (!item) return;
    onPick(item);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="quick-search" ref={wrapRef}>
      <input
        ref={inputRef}
        className="quick-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Quick add…  Ctrl K"
        aria-label="Quick add a skill"
        spellCheck={false}
      />

      {open && results.length > 0 && (
        <ul className="quick-results" role="listbox">
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className={`quick-result ${i === active ? "on" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
              >
                <Image
                  src={item.iconsrc}
                  alt=""
                  width={32}
                  height={32}
                  draggable={false}
                />
                <span className="quick-name">{item.title}</span>
                <span className="quick-kind">
                  {KIND_LABEL[item.kind] ?? ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <ul className="quick-results">
          <li className="quick-empty">No match for “{query.trim()}”</li>
        </ul>
      )}
    </div>
  );
}

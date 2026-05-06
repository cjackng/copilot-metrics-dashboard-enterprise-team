"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useGridFilter } from "ag-grid-react";

interface MultiSelectFilterProps {
  model: string[] | null;
  onModelChange: (model: string[] | null) => void;
  getValue: (node: any) => any;
  api: any;
  colDef: any;
  column: any;
  /** If true, cell values are arrays that should be flattened for filter options */
  isArrayColumn?: boolean;
  /**
   * If provided, only these values will appear as options (sourced externally,
   * e.g. from a page-level filter that has already narrowed the row data).
   * Changing this prop causes the option list to refresh immediately.
   */
  options?: string[];
}

const UNASSIGNED_LABEL = "(Unassigned)";

function isNullish(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "undefined" ||
    value === "null"
  );
}

export const AgGridMultiSelectFilter = (props: MultiSelectFilterProps) => {
  const { model, onModelChange, getValue, api, colDef, isArrayColumn, options: externalOptions } = props;
  const [searchText, setSearchText] = useState("");

  const selectedValues = useMemo(() => new Set(model ?? []), [model]);

  // Filtering logic
  const doesFilterPass = useCallback(
    ({ node }: { node: any }) => {
      if (!model || model.length === 0) return true;
      const selected = new Set(model);
      const raw = getValue(node);
      if (isArrayColumn && Array.isArray(raw)) {
        if (raw.length === 0) return selected.has(UNASSIGNED_LABEL);
        return raw.some((item: unknown) => {
          const label = isNullish(item) ? UNASSIGNED_LABEL : String(item);
          return selected.has(label);
        });
      }
      if (isNullish(raw)) return selected.has(UNASSIGNED_LABEL);
      return selected.has(String(raw));
    },
    [model, getValue, isArrayColumn]
  );

  // Register filter with grid
  useGridFilter({ doesFilterPass });

  // Compute all unique values from column data
  const allOptions = useMemo(() => {
    // If external options are provided (e.g. from a page-level filter that already
    // narrowed rowData), derive counts only for those values and skip api.forEachNode
    // full-scan. This also ensures the list reacts when `externalOptions` changes.
    if (externalOptions) {
      const allowedSet = new Set(externalOptions);
      const valueCounts = new Map<string, number>();
      for (const v of externalOptions) valueCounts.set(v, 0);
      api.forEachNode((node: any) => {
        if (!node.data) return;
        const raw = node.data[colDef.field as string];
        if (isArrayColumn && Array.isArray(raw)) {
          raw.forEach((item: unknown) => {
            const label = isNullish(item) ? UNASSIGNED_LABEL : String(item);
            if (allowedSet.has(label)) valueCounts.set(label, (valueCounts.get(label) || 0) + 1);
          });
        } else if (!isNullish(raw)) {
          const str = String(raw);
          if (allowedSet.has(str)) valueCounts.set(str, (valueCounts.get(str) || 0) + 1);
        }
      });
      return Array.from(valueCounts.entries()).sort(([a], [b]) => {
        if (a === UNASSIGNED_LABEL) return 1;
        if (b === UNASSIGNED_LABEL) return -1;
        return a.localeCompare(b);
      });
    }

    const valueCounts = new Map<string, number>();
    api.forEachNode((node: any) => {
      if (!node.data) return;
      const raw = node.data[colDef.field as string];
      if (isArrayColumn && Array.isArray(raw)) {
        if (raw.length === 0) {
          valueCounts.set(UNASSIGNED_LABEL, (valueCounts.get(UNASSIGNED_LABEL) || 0) + 1);
        } else {
          raw.forEach((item: unknown) => {
            const label = isNullish(item) ? UNASSIGNED_LABEL : String(item);
            valueCounts.set(label, (valueCounts.get(label) || 0) + 1);
          });
        }
      } else if (isNullish(raw)) {
        valueCounts.set(UNASSIGNED_LABEL, (valueCounts.get(UNASSIGNED_LABEL) || 0) + 1);
      } else {
        const str = String(raw);
        valueCounts.set(str, (valueCounts.get(str) || 0) + 1);
      }
    });
    return Array.from(valueCounts.entries()).sort(([a], [b]) => {
      if (a === UNASSIGNED_LABEL) return 1;
      if (b === UNASSIGNED_LABEL) return -1;
      return a.localeCompare(b);
    });
  }, [api, colDef.field, isArrayColumn, externalOptions]);

  const filteredOptions = useMemo(() => {
    if (!searchText) return allOptions;
    const lower = searchText.toLowerCase();
    return allOptions.filter(([value]) => value.toLowerCase().includes(lower));
  }, [allOptions, searchText]);

  const allFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every(([v]) => selectedValues.has(v));
  const someFilteredSelected =
    filteredOptions.some(([v]) => selectedValues.has(v)) && !allFilteredSelected;

  const toggleValue = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onModelChange(next.size > 0 ? Array.from(next) : null);
  };

  const toggleAll = () => {
    const next = new Set(selectedValues);
    if (allFilteredSelected) {
      // Deselect only the currently visible options
      for (const [v] of filteredOptions) {
        next.delete(v);
      }
    } else {
      // Select all currently visible options (merge with existing)
      for (const [v] of filteredOptions) {
        next.add(v);
      }
    }
    onModelChange(next.size > 0 ? Array.from(next) : null);
  };

  return (
    <div
      style={{
        padding: "8px",
        minWidth: "200px",
        maxHeight: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        fontSize: "13px",
        color: "var(--ag-foreground-color)",
        backgroundColor: "var(--ag-background-color)",
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{
          width: "100%",
          padding: "4px 8px",
          border: "1px solid var(--ag-border-color)",
          borderRadius: "4px",
          fontSize: "12px",
          outline: "none",
          backgroundColor: "var(--ag-input-background-color)",
          color: "var(--ag-foreground-color)",
        }}
      />

      {/* Options list */}
      <div style={{ overflowY: "auto", maxHeight: "200px", display: "flex", flexDirection: "column" }}>
        {/* Select all */}
        <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0", cursor: "pointer", fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={allFilteredSelected}
            ref={(el) => { if (el) el.indeterminate = someFilteredSelected; }}
            onChange={toggleAll}
            style={{ accentColor: "var(--ag-accent-color)" }}
          />
          (Select All)
        </label>

        {filteredOptions.map(([value, count]) => (
          <label
            key={value}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 0", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={selectedValues.has(value)}
              onChange={() => toggleValue(value)}
              style={{ accentColor: "var(--ag-accent-color)" }}
            />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontStyle: value === UNASSIGNED_LABEL ? "italic" : "normal",
                opacity: value === UNASSIGNED_LABEL ? 0.7 : 1,
              }}
            >
              {value}
            </span>
            <span style={{ fontSize: "11px", opacity: 0.6 }}>{count}</span>
          </label>
        ))}

        {filteredOptions.length === 0 && (
          <span style={{ fontSize: "12px", opacity: 0.5, padding: "4px 0" }}>
            No results found.
          </span>
        )}
      </div>
    </div>
  );
};

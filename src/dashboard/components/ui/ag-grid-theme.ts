"use client";

import { themeQuartz } from "ag-grid-community";

/**
 * AG Grid theme that maps to shadcn/ui CSS variables.
 * Supports dark mode automatically via CSS custom properties.
 */
export const agGridShadcnTheme = themeQuartz.withParams({
  fontFamily: "inherit",
  backgroundColor: "hsl(var(--background))",
  foregroundColor: "hsl(var(--foreground))",
  borderColor: "hsl(var(--border))",
  borderRadius: 6,
  headerBackgroundColor: "hsl(var(--muted))",
  headerTextColor: "hsl(var(--muted-foreground))",
  headerFontWeight: 500,
  headerFontSize: 13,
  fontSize: 14,
  rowHoverColor: "hsl(var(--accent))",
  selectedRowBackgroundColor: "hsl(var(--accent))",
  accentColor: "hsl(var(--primary))",
  inputBorder: { color: "hsl(var(--border))" },
  inputBackgroundColor: "hsl(var(--background))",
  chromeBackgroundColor: "hsl(var(--popover))",
  menuBackgroundColor: "hsl(var(--popover))",
  menuTextColor: "hsl(var(--popover-foreground))",
  modalOverlayBackgroundColor: "hsl(var(--background) / 0.8)",
  columnBorder: false,
  wrapperBorderRadius: 8,
  cellHorizontalPadding: 12,
  spacing: 6,
});

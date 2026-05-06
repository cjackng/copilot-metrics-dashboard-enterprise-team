"use client";
import { useDashboard } from "./dashboard-state";
import { format, parseISO } from "date-fns";
import { PageHeader, PageTitle } from "../page-header/page-header";
import { WeekendFilter } from "./filter/weekend-filter";
import { Filters } from "./filter/header-filter";

export const Header = () => {
  const { lastUpdatedTime } = useDashboard();

  const formattedLastUpdated = lastUpdatedTime
    ? format(parseISO(lastUpdatedTime), "dd MMM yyyy HH:mm")
    : null;

  return (
    <PageHeader>
      <PageTitle>GitHub Copilot Metrics</PageTitle>
      <div className="flex flex-col gap-4">
        <div className="flex gap-8 justify-between flex-col md:flex-row">
          <Filters />
          <div className="flex gap-2">
            <WeekendFilter />
          </div>
        </div>
        {formattedLastUpdated && (
          <p className="text-xs text-muted-foreground">Data last updated: {formattedLastUpdated}</p>
        )}
      </div>
    </PageHeader>
  );
};

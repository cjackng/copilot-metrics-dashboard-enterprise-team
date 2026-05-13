"use client";
import { useDashboard } from "./dashboard-state";
import { format, parseISO } from "date-fns";
import { PageHeader, PageTitle } from "../page-header/page-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WeekendFilter } from "./filter/weekend-filter";
import { Filters } from "./filter/header-filter";
import { InfoIcon } from "lucide-react";

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
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Data last updated: {formattedLastUpdated}</p>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="bg-popover text-popover-foreground p-3 max-w-[320px] border">
                  <p className="text-sm leading-relaxed">Data with 2 days delay.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
      </div>
    </PageHeader>
  );
};

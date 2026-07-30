"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TableToolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  filterValue,
  onFilterChange,
  filterPlaceholder,
  filterOptions,
}: {
  query?: string;
  onQueryChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
  filterOptions?: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onQueryChange && (
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query ?? ""}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}
      {filterOptions && onFilterChange && (
        <Select
          value={filterValue ?? "all"}
          onValueChange={(v) => onFilterChange(v as string)}
          items={{ all: "Semua", ...Object.fromEntries(filterOptions.map((o) => [o.value, o.label])) }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={filterPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {filterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

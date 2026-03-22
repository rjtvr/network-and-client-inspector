import type { InspectorFilters, StatusFilter } from "../models";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "2xx" },
  { value: "redirect", label: "3xx" },
  { value: "client-error", label: "4xx" },
  { value: "server-error", label: "5xx" }
];

interface InspectorToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: InspectorFilters;
  methodOptions: string[];
  typeOptions: string[];
  onFiltersChange: (filters: InspectorFilters) => void;
}

export function InspectorToolbar({
  searchValue,
  onSearchChange,
  filters,
  methodOptions,
  typeOptions,
  onFiltersChange
}: InspectorToolbarProps) {
  return (
    <section>
      <div className="flex flex-col gap-4">
        <label className="block">
          <span className="sr-only">Search requests by URL</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by URL substring"
            className="w-full rounded-2xl border border-line bg-zinc-50 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate focus:border-accent focus:bg-white"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <FilterSelect
            label="Method"
            value={filters.method}
            options={methodOptions}
            onChange={(value) => onFiltersChange({ ...filters, method: value })}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            options={statusOptions.map((option) => option.value)}
            labels={Object.fromEntries(statusOptions.map((option) => [option.value, option.label]))}
            onChange={(value) => onFiltersChange({ ...filters, status: value as StatusFilter })}
          />
          <FilterSelect
            label="Type"
            value={filters.type}
            options={typeOptions}
            onChange={(value) => onFiltersChange({ ...filters, type: value })}
          />
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-zinc-50 px-4 py-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={filters.findingsOnly}
              onChange={(event) => onFiltersChange({ ...filters, findingsOnly: event.target.checked })}
              className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            <span className="font-medium">Findings Only</span>
          </label>
        </div>
      </div>
    </section>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, labels, onChange }: FilterSelectProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-line bg-zinc-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? (option === "all" ? `All ${label}s` : option.toUpperCase())}
          </option>
        ))}
      </select>
    </label>
  );
}
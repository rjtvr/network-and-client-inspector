import type { InspectorTab } from "../models";

interface InspectorTabsProps {
  activeTab: InspectorTab;
  requestCount: number;
  findingsCount: number;
  onTabChange: (tab: InspectorTab) => void;
}

export function InspectorTabs({ activeTab, requestCount, findingsCount, onTabChange }: InspectorTabsProps) {
  const tabs: Array<{ id: InspectorTab; label: string; count?: number }> = [
    { id: "requests", label: "Requests", count: requestCount },
    { id: "security", label: "Security", count: findingsCount },
    { id: "performance", label: "Performance" },
    { id: "client", label: "Client" }
  ];

  return (
    <nav className="mt-5 flex flex-wrap gap-2" aria-label="Inspector views">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-ink text-white"
                : "border border-line bg-white text-slate hover:border-teal-200 hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count !== undefined ? ` (${tab.count})` : ""}
          </button>
        );
      })}
    </nav>
  );
}

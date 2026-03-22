interface PopupHeaderProps {
  tabTitle: string;
  domain: string;
  status: string;
}

export function PopupHeader({ tabTitle, domain, status }: PopupHeaderProps) {
  return (
    <header>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
            Active Tab
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight text-ink">{tabTitle}</h1>
          <p className="mt-2 text-sm text-slate">{domain}</p>
        </div>
        <span className="rounded-full border border-teal-200 bg-accentSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {status}
        </span>
      </div>
    </header>
  );
}
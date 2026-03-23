interface SessionControlsProps {
  captureState: string;
  isBusy?: boolean;
  hasRequests: boolean;
  onPauseResume: () => void;
  onClear: () => void;
  onExport: () => void;
  removeAccessDisabled?: boolean;
  onRemoveAccess?: () => void;
}

export function SessionControls({
  captureState,
  isBusy = false,
  hasRequests,
  onPauseResume,
  onClear,
  onExport,
  removeAccessDisabled = false,
  onRemoveAccess
}: SessionControlsProps) {
  const pauseResumeLabel = captureState === "paused" ? "Resume Capture" : "Pause Capture";
  const pauseResumeDisabled = captureState !== "capturing" && captureState !== "paused";

  return (
    <section className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={isBusy || pauseResumeDisabled}
        onClick={onPauseResume}
        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isBusy || pauseResumeDisabled
            ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
            : "bg-amber-500 text-white hover:bg-amber-600"
        }`}
      >
        {pauseResumeLabel}
      </button>
      <button
        type="button"
        disabled={isBusy || !hasRequests}
        onClick={onClear}
        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isBusy || !hasRequests
            ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
            : "bg-white text-ink border border-line hover:bg-zinc-50"
        }`}
      >
        Clear Session
      </button>
      <button
        type="button"
        disabled={!hasRequests}
        onClick={onExport}
        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          !hasRequests
            ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
            : "bg-accent text-white hover:bg-teal-700"
        }`}
      >
        Export JSON
      </button>
      {onRemoveAccess ? (
        <button
          type="button"
          disabled={isBusy || removeAccessDisabled}
          onClick={onRemoveAccess}
          className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            isBusy || removeAccessDisabled
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          Remove Site Access
        </button>
      ) : null}
    </section>
  );
}

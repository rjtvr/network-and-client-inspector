interface PopupActionRowProps {
  primaryActionLabel: string;
  isCapturing: boolean;
  isDisabled?: boolean;
  onPrimaryAction: () => void;
  onOpenInspector: () => void;
}

export function PopupActionRow({
  primaryActionLabel,
  isCapturing,
  isDisabled = false,
  onPrimaryAction,
  onOpenInspector
}: PopupActionRowProps) {
  return (
    <section className="mt-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={isDisabled}
        onClick={onPrimaryAction}
        className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isDisabled
            ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
            : isCapturing
              ? "bg-ink text-white hover:bg-zinc-800"
              : "bg-accent text-white hover:bg-teal-700"
        }`}
      >
        {primaryActionLabel}
      </button>
      <button
        type="button"
        onClick={onOpenInspector}
        className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-50"
      >
        Open Inspector
      </button>
    </section>
  );
}
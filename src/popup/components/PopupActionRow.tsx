interface PopupActionRowProps {
  primaryActionLabel: string;
  isCapturing: boolean;
  isDisabled?: boolean;
  onPrimaryAction: () => void;
  onOpenInspector: () => void;
  revokeActionLabel?: string;
  isRevokeDisabled?: boolean;
  onRevokeAction?: () => void;
}

export function PopupActionRow({
  primaryActionLabel,
  isCapturing,
  isDisabled = false,
  onPrimaryAction,
  onOpenInspector,
  revokeActionLabel,
  isRevokeDisabled = false,
  onRevokeAction
}: PopupActionRowProps) {
  return (
    <section className="mt-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      {revokeActionLabel && onRevokeAction ? (
        <button
          type="button"
          disabled={isRevokeDisabled}
          onClick={onRevokeAction}
          className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            isRevokeDisabled
              ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          {revokeActionLabel}
        </button>
      ) : null}
    </section>
  );
}

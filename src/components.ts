export type FeedbackKind = "neutral" | "success" | "error";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderFeedbackStrip(
  message: string,
  kind: FeedbackKind,
): string {
  const icon = kind === "success" ? "✓" : kind === "error" ? "!" : "→";
  return `<section class="feedback-strip ${kind}" aria-labelledby="feedback-title" aria-live="polite"><div><span class="eyebrow">Feedback</span><h2 id="feedback-title">${escapeHtml(message)}</h2></div><span aria-hidden="true">${icon}</span></section>`;
}

export function renderProgressLabel(completed: number, total: number): string {
  return `Progress <span>${completed}/${total}</span>`;
}

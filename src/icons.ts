export type IconName =
  | "upload"
  | "sample"
  | "format"
  | "copy"
  | "download"
  | "trash"
  | "swap";

const paths: Record<IconName, string> = {
  upload:
    '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>',
  sample:
    '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"/>',
  format:
    '<path d="m15 4 5 5L8.5 20.5a2.1 2.1 0 0 1-3-3L17 6Z"/><path d="m13 6 5 5"/><path d="M6 3v4M4 5h4M19 16v4M17 18h4"/>',
  copy: '<rect width="12" height="12" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  download:
    '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 15H6L5 6"/><path d="M10 11v5M14 11v5"/>',
  swap: '<path d="m16 3 4 4-4 4"/><path d="M4 7h16"/><path d="m8 21-4-4 4-4"/><path d="M20 17H4"/>',
};

export function icon(name: IconName): string {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

export const EZOIC_PLACEMENTS = {
  homepageMiddle: 101,
  footerBottom: 102,
} as const;

export function runEzoic(fn: () => void) {
  if (typeof window === "undefined") return;

  const ezstandalone = (window.ezstandalone ||= { cmd: [] });
  ezstandalone.cmd ||= [];
  ezstandalone.cmd.push(fn);
}

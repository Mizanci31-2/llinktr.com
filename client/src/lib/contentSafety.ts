const BLOCKED_TERMS = [
  "adult",
  "porno",
  "bahis",
  "casino",
  "scam",
  "phishing",
  "malware",
  "hack",
  "doland1r1c1l1k",
];

const SUSPICIOUS_HOSTS = ["bit.ly", "tinyurl.com", "ow.ly", "is.gd", "cutt.ly"];

export function getContentSafetyWarnings(values: string[]) {
  const text = values.join(" ").toLowerCase();
  const warnings: string[] = [];

  const blockedTerm = BLOCKED_TERMS.find((term) => text.includes(term));
  if (blockedTerm) warnings.push(`Politika riski alg1land1: ${blockedTerm}`);

  for (const value of values) {
    try {
      const url = new URL(value.startsWith("http") ? value : `https://${value}`);
      if (SUSPICIOUS_HOSTS.includes(url.hostname.replace(/^www\./, ""))) {
        warnings.push("K1salt1lm1_ veya maskelenmi_ balant1 spam kontrol�ne al1nabilir.");
      }
    } catch {
      // Plain text fields are allowed; URL validation happens where links are saved.
    }
  }

  return warnings;
}

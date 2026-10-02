import { type ClassValue, clsx } from "clsx";
import { Publication } from "@/types/publication";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2025-09" -> "Sep 2025"
export function formatNewsDate(date: string): string {
  const [year, month] = date.split('-');
  const m = parseInt(month, 10);
  return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${year}` : year;
}

// "Advances in Neural Information Processing Systems (NeurIPS)" -> "NeurIPS 2025"; a `venue` field overrides
export function shortVenue(pub: Publication): string {
  if (pub.venue) return pub.venue;
  const full = pub.conference || pub.journal || '';
  const abbr = /arxiv/i.test(full) ? 'arXiv' : full.match(/\(([^)]+)\)\s*$/)?.[1];
  return `${abbr || full || 'Preprint'} ${pub.year}`.trim();
}

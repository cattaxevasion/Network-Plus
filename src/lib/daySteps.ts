import { getPlanDay } from '../data/plan';
import { DOWNLOAD_PDFS_STEP, GUIDES, type Step } from '../data/steps';

/** The PDF steps for a given plan day (Day 1 also includes "Download PDFs"). */
export function stepsFor(day: number): Step[] {
  const p = getPlanDay(day);
  if (!p) return [];
  const steps = GUIDES[p.phase].steps;
  return p.items.some((i) => i.kind === 'downloadPdfs') ? [DOWNLOAD_PDFS_STEP, ...steps] : steps;
}

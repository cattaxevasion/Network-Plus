// The list of items questions are recorded against: objectives or domains,
// depending on PRACTICE_EXAM_CONFIG.trackBy.

import { PRACTICE_EXAM_CONFIG } from '../config/practiceExam';
import { DOMAINS, OBJECTIVES, shortTitle, type Domain } from '../data/objectives';

export interface TrackingUnit {
  id: string; // '1.4' (objective) or '1.0' (domain)
  domain: Domain;
  title: string;
  short: string;
}

const byObjective: TrackingUnit[] = OBJECTIVES.map((o) => ({ id: o.id, domain: o.domain, title: o.title, short: shortTitle(o) }));

const byDomain: TrackingUnit[] = ([1, 2, 3, 4, 5] as Domain[]).map((d) => ({
  id: `${d}.0`,
  domain: d,
  title: DOMAINS[d].name,
  short: DOMAINS[d].name,
}));

export const TRACK_BY = PRACTICE_EXAM_CONFIG.trackBy;
export const UNITS: TrackingUnit[] = TRACK_BY === 'domain' ? byDomain : byObjective;
export const UNIT_BY_ID: Record<string, TrackingUnit> = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const UNIT_NOUN = TRACK_BY === 'domain' ? 'domain' : 'objective';
export const UNIT_NOUN_PLURAL = TRACK_BY === 'domain' ? 'domains' : 'objectives';

/** Group units by exam domain (a single group per domain in domain mode). */
export function unitsByDomain(): Array<{ domain: Domain; units: TrackingUnit[] }> {
  return ([1, 2, 3, 4, 5] as Domain[]).map((domain) => ({ domain, units: UNITS.filter((u) => u.domain === domain) }));
}

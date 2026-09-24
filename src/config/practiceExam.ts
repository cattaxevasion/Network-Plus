// ============================================================================
//  Practice exam settings: everything still unknown before studying starts.
//  Edit values here once you have seen the real practice exams.
//  Every screen and calculation reads from this file; nothing else needs to change.
//  (All values below are app design choices, not part of the Study Plan PDF.)
// ============================================================================

export type TrackBy = 'objective' | 'domain';

export const PRACTICE_EXAM_CONFIG = {
  /**
   * What each question is recorded against in the exam form and weak-area analysis.
   *   'objective' -> 1.1 … 5.5 (25 items). Use if the exam review shows the objective per question.
   *   'domain'    -> 1.0 … 5.0 (5 items).  Use if it only shows the domain.
   * Switching later: results recorded in the other mode are kept but not shown.
   */
  trackBy: 'objective' as TrackBy,

  /**
   * Weak-area levels. Level = the worse of
   *   overall accuracy (all counted exams) and recent accuracy (last `recentWindow` exams the item appeared in).
   *   below weakAccuracy     -> Weak
   *   below moderateAccuracy -> Moderate
   *   otherwise              -> Strong
   *   fewer than minQuestions questions in total -> Not enough data
   */
  weakAreaRules: {
    minQuestions: 3,
    weakAccuracy: 0.7,
    moderateAccuracy: 0.85,
    recentWindow: 3,
  },

  /**
   * false: only first attempts decide weak areas; retakes are shown separately
   * (remembered answers inflate retake scores, see Study Plan p.6).
   */
  retakesCountForWeakAreas: false,
} as const;

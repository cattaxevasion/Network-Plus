// Source: "CompTIA Network+ (N10-009) Study Plan" (Dion Training), 60-Day Study Plan, p.12–13.
// `sourceText` is copied verbatim from the PDF table. Do not edit the plan itself here;
// it is the source of truth. `items` is only a structured reading of the same text.

export type Phase = 'video' | 'exam' | 'retake';

export type PlanItem =
  | { kind: 'section'; section: number; videos?: [number, number] }
  | { kind: 'downloadPdfs' }
  | { kind: 'practiceExam'; mode: 'take' | 'retake' };

export interface PlanDay {
  day: number;
  phase: Phase;
  sourceText: string[];
  items: PlanItem[];
}

const sec = (section: number, videos?: [number, number]): PlanItem =>
  videos ? { kind: 'section', section, videos } : { kind: 'section', section };

const videoDays: Array<[string[], PlanItem[]]> = [
  /* 1 */ [
    ['Watch sections 1', 'Download PDFs'],
    [sec(1), { kind: 'downloadPdfs' }],
  ],
  /* 2 */ [['Watch section 2'], [sec(2)]],
  /* 3 */ [['Watch section 3'], [sec(3)]],
  /* 4 */ [['Watch section 4'], [sec(4)]],
  /* 5 */ [['Watch section 5'], [sec(5)]],
  /* 6 */ [['Watch section 6'], [sec(6)]],
  /* 7 */ [['Watch section 7'], [sec(7)]],
  /* 8 */ [['Watch Section 8 videos 1-7'], [sec(8, [1, 7])]],
  /* 9 */ [['Watch Section 8 videos 8-10 and Section 9 videos 1-4'], [sec(8, [8, 10]), sec(9, [1, 4])]],
  /* 10 */ [['Watch Section 9 videos 5-9'], [sec(9, [5, 9])]],
  /* 11 */ [['Watch Section 9 videos 10-12'], [sec(9, [10, 12])]],
  /* 12 */ [['Watch section 10'], [sec(10)]],
  /* 13 */ [['Watch section 11'], [sec(11)]],
  /* 14 */ [['Watch section 12'], [sec(12)]],
  /* 15 */ [['Watch section 13'], [sec(13)]],
  /* 16 */ [['Watch section 14'], [sec(14)]],
  /* 17 */ [['Watch section 15'], [sec(15)]],
  /* 18 */ [['Watch section 16 videos 1-6'], [sec(16, [1, 6])]],
  /* 19 */ [['Watch section 16 videos 7-11'], [sec(16, [7, 11])]],
  /* 20 */ [['Watch section 17 videos 1-7'], [sec(17, [1, 7])]],
  /* 21 */ [['Watch section 17 videos 8-14'], [sec(17, [8, 14])]],
  /* 22 */ [['Watch section 18 videos 1-6'], [sec(18, [1, 6])]],
  /* 23 */ [['Watch section 18 videos 7-11'], [sec(18, [7, 11])]],
  /* 24 */ [['Watch section 19'], [sec(19)]],
  /* 25 */ [['Watch section 20'], [sec(20)]],
  /* 26 */ [['Watch section 21'], [sec(21)]],
  /* 27 */ [['Watch section 22'], [sec(22)]],
  /* 28 */ [['Watch section 23 videos 1-7'], [sec(23, [1, 7])]],
  /* 29 */ [['Watch section 23 videos 8-13'], [sec(23, [8, 13])]],
  /* 30 */ [['Watch section 24'], [sec(24)]],
  /* 31 */ [['Watch section 25'], [sec(25)]],
  /* 32 */ [['Watch section 26'], [sec(26)]],
  /* 33 */ [['Watch sections 27 and 28'], [sec(27), sec(28)]],
];

export const PLAN: PlanDay[] = [
  ...videoDays.map(([sourceText, items], i) => ({ day: i + 1, phase: 'video' as const, sourceText, items })),
  // Day 34–46: "Take 1 Practice Exam"
  ...Array.from({ length: 13 }, (_, i) => ({
    day: 34 + i,
    phase: 'exam' as const,
    sourceText: ['Take 1 Practice Exam'],
    items: [{ kind: 'practiceExam', mode: 'take' } as PlanItem],
  })),
  // Day 47–60: "Retake 1 Practice Exam"
  ...Array.from({ length: 14 }, (_, i) => ({
    day: 47 + i,
    phase: 'retake' as const,
    sourceText: ['Retake 1 Practice Exam'],
    items: [{ kind: 'practiceExam', mode: 'retake' } as PlanItem],
  })),
];

export const TOTAL_DAYS = PLAN.length; // 60

export const PHASES: Record<Phase, { label: string; range: [number, number] }> = {
  video: { label: 'Videos', range: [1, 33] },
  exam: { label: 'Practice Exams', range: [34, 46] },
  retake: { label: 'Retakes', range: [47, 60] },
};

export function getPlanDay(day: number): PlanDay | undefined {
  return PLAN[day - 1];
}

// Daily steps taken from the Study Plan PDF. Wording follows the PDF closely.
//   video  -> "How to Use the Videos Effectively" (p.4)
//   exam   -> "How to Use the Practice Exams Effectively" (p.5)
//   retake -> "How to Make Retaking the Exam an Effective Learning Tool" (p.6)
// `tips` are PDF guidance shown alongside the steps; they are not checkable.

import type { Phase } from './plan';

export interface Step {
  key: string;
  label: string;
  /** step is about flashcards -> show the external flashcard link next to it */
  flashcards?: boolean;
  /** step is recording results in this app -> link to the exam form */
  recordsExam?: boolean;
}

export interface PhaseGuide {
  steps: Step[];
  tips: string[];
}

export const GUIDES: Record<Phase, PhaseGuide> = {
  video: {
    steps: [
      { key: 'watch', label: 'Watch the videos, adding notes to the study guide' },
      { key: 'reread', label: 'Reread the study guide and your notes' },
      { key: 'create-cards', label: 'Create flashcards or study tools', flashcards: true },
      { key: 'review-cards', label: "Review the previous day's flashcards or study tools", flashcards: true },
    ],
    tips: [
      'Highlight terms and concepts you want to make flashcards for.',
      'Mark terms or sections based on how well you understand them.',
      'Put question marks next to concepts you want to research more.',
    ],
  },
  exam: {
    steps: [
      { key: 'brain-dump', label: 'Do a brain dump when you begin the exam' },
      { key: 'take', label: 'Take the practice exam' },
      { key: 'review-incorrect', label: 'Review incorrect questions and read the explanations' },
      { key: 'add-cards', label: 'Add them to your flashcards / study tools and study guide', flashcards: true },
      { key: 'review-dump', label: 'Review your brain dump and decide whether to change it' },
      { key: 'record', label: 'Record correct and incorrect objectives', recordsExam: true },
    ],
    tips: ["Follow the tips from the course's Conclusion video."],
  },
  retake: {
    steps: [
      { key: 'take', label: 'Retake the practice exam' },
      { key: 'review-incorrect', label: 'Review incorrect questions and read the explanations' },
      { key: 'add-cards', label: 'Add them to your flashcards / study tools and study guide', flashcards: true },
      { key: 'review-dump', label: 'Review your brain dump and decide whether to change it' },
      { key: 'record', label: 'Add the retake to the tracking chart', recordsExam: true },
    ],
    tips: [
      'When you recognize a question, think through why the correct answer is correct instead of just clicking the remembered answer.',
    ],
  },
};

/** Day 1 also has "Download PDFs" in the plan. */
export const DOWNLOAD_PDFS_STEP: Step = { key: 'download-pdfs', label: 'Download the course PDFs' };

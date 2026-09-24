/* =========================================================
   TagSci Content Studio - Data Store & Subject Taxonomy
   ========================================================= */

export const OFFICIAL_SUBJECTS = {
  'TagSci': { type: 'Institutional', color: 'border-l-4 border-tagsci-700' },
  'DepEd': { type: 'DepEd', color: 'border-l-4 border-blue-600' },
  'Effective Communications': { type: 'Main', color: 'border-l-4 border-blue-500' },
  'Mabisang Komunikasyon': { type: 'Main', color: 'border-l-4 border-amber-500' },
  'Life and Career Skills': { type: 'Main', color: 'border-l-4 border-emerald-500' },
  'General Math': { type: 'Main', color: 'border-l-4 border-g11pink-500' },
  'General Science': { type: 'Main', color: 'border-l-4 border-teal-500' },
  'Finite Math': { type: 'Elective', color: 'border-l-4 border-purple-500' },
  'Physics': { type: 'Elective', color: 'border-l-4 border-tagsci-600' },
  'Chemistry': { type: 'Elective', color: 'border-l-4 border-indigo-500' },
  'Biology': { type: 'Elective', color: 'border-l-4 border-green-600' }
};

export function getSubjectClassification(subj) {
  return OFFICIAL_SUBJECTS[subj] || { type: 'Main', color: 'border-l-4 border-tagsci-600' };
}

export const STUDIO_DATA = {
  version: "1.4.0",
  updatedAt: new Date().toISOString(),
  announcement: "Materials authored via TagSci G11 Content Studio.",
  calendarEvents: [],
  stemReviewers: [],
  studyMaterials: [],
  problemSets: [],
  quizSets: []
};

export let currentRevIndex = 0;
export let currentQuizSetIndex = 0;
export let currentEditorMode = 'visual';

export function setCurrentRevIndex(idx) { currentRevIndex = idx; }
export function setCurrentQuizSetIndex(idx) { currentQuizSetIndex = idx; }
export function setCurrentEditorMode(mode) { currentEditorMode = mode; }

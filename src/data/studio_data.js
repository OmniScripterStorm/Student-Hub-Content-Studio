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
  calendarEvents: [
    {
      id: 1,
      date: "2026-09-25",
      subject: "Physics",
      title: "Periodical Exam - Kinematics & Dynamics",
      type: "exam",
      badge: "Exam / 60 pts",
      desc: "Coverage: 1D & 2D Motion, Projectile Motion, Newton's Laws. Scientific calculators allowed."
    },
    {
      id: 2,
      date: "2026-09-28",
      subject: "Finite Math",
      title: "PETA 1 Submission - Mathematical Modeling",
      type: "peta",
      badge: "Performance Task",
      desc: "Matrix operations, linear programming, and real-world system optimization."
    },
    {
      id: 3,
      date: "2026-10-02",
      subject: "Chemistry",
      title: "Long Quiz #2 - Stoichiometry & Gas Laws",
      type: "quiz",
      badge: "Quiz / 30 pts",
      desc: "Ideal Gas Law, Dalton's Law, Limiting Reactants."
    }
  ],
  stemReviewers: [
    {
      id: "physics_kinematics",
      subject: "Physics",
      tag: "Elective",
      color: "border-l-4 border-tagsci-600",
      title: "Kinematics in 1D & 2D Motion",
      summary: "Master velocity, acceleration, free fall, and projectile trajectories with derivations.",
      blocks: [
        { type: 'heading', level: 'h3', text: '1. Fundamental Kinematic Equations' },
        { type: 'paragraph', text: 'For linear particle motion with constant acceleration $a$:' },
        { type: 'formula', title: 'Torricelli Velocity Relation', formula: 'v_f^2 = v_0^2 + 2a\\Delta x', note: 'Relates initial and final velocities to displacement without time dependence.' },
        { type: 'formula', title: 'Position-Time Equation', formula: '\\Delta x = v_0 t + \\frac{1}{2}at^2', note: 'Calculates total distance traveled under constant acceleration.' },
        { type: 'bullets', items: ['Horizontal velocity $v_x = v_0\\cos\\theta$ is strictly constant.', 'Vertical motion is influenced by downward gravitational acceleration $g = 9.8\\text{ m/s}^2$.'] }
      ],
      rawMarkdown: "",
      content: ""
    },
    {
      id: "gen_math_functions",
      subject: "General Math",
      tag: "Main",
      color: "border-l-4 border-g11pink-500",
      title: "Functions, Rational Equations & Inverses",
      summary: "Domain, range, rational functions, asymptotes, and inverse function properties.",
      blocks: [
        { type: 'heading', level: 'h3', text: '1. Rational Functions & Asymptotes' },
        { type: 'paragraph', text: 'A rational function is defined as a fraction of polynomials $f(x) = \\frac{P(x)}{Q(x)}$ where $Q(x) \\neq 0$.' },
        { type: 'formula', title: 'Standard Rational Form', formula: 'f(x) = \\frac{a_n x^n + \\dots}{b_m x^m + \\dots}', note: 'Compare degree n and degree m to find horizontal asymptotes.' },
        { type: 'bullets', items: ['Vertical Asymptote: Values of x where denominator Q(x) = 0.', 'Horizontal Asymptote: If n < m, y = 0. If n = m, y = a_n / b_m.'] }
      ],
      rawMarkdown: "",
      content: ""
    }
  ],
  studyMaterials: [],
  problemSets: [],
  quizSets: [
    {
      id: "quiz_set_1",
      subject: "Effective Communications",
      tag: "Main",
      title: "Untitled Quiz Set",
      desc: "",
      timeLimitMinutes: 15,
      questions: []
    }
  ]
};

export let currentRevIndex = 0;
export let currentQuizSetIndex = 0;
export let currentEditorMode = 'visual';

export function setCurrentRevIndex(idx) { currentRevIndex = idx; }
export function setCurrentQuizSetIndex(idx) { currentQuizSetIndex = idx; }
export function setCurrentEditorMode(mode) { currentEditorMode = mode; }

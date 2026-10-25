/* =========================================================
   TagSci Content Studio - Data Store & Subject Taxonomy
   ========================================================= */

export const OFFICIAL_SUBJECTS = {
  'TagSci': { type: 'Institutional', color: 'border-l-4 border-tagsci-700' },
  'DepEd': { type: 'DepEd', color: 'border-l-4 border-blue-600' },
  'Kasaysayan': { type: 'Main', color: 'border-l-4 border-amber-600' },
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

export const DEFAULT_FLASHCARD_DECKS = [
  {
    "id": "deck_kasaysayan_aralin_1",
    "subject": "Kasaysayan",
    "tag": "Main",
    "color": "border-l-4 border-amber-600",
    "title": "Summative 1: Zeus Salazar & Konsepto ng Kasaysayan",
    "desc": "Active recall on Pantayong Pananaw, Tatlong Yugto ng Kasaysayan, and historical methodologies.",
    "cards": [
      {
        "id": "kas_01",
        "topic": "Batayang Kahulugan",
        "front": "Ano ang depinisyon ng **Kasaysayan** ayon sa Pantayong Pananaw ni Dr. Zeus Salazar?",
        "back": "Ang kasaysayan ay **salaysay na may saysay para sa sinasalaysayang grupo ng tao** (kailangang may saysay para sa sariling kabuuan).",
        "hint": "Tandaan ang dalawang salitang-ugat: Salaysay (kuwento) at Saysay (katuturan o kabuluhan)."
      },
      {
        "id": "kas_02",
        "topic": "Pananaw sa Kasaysayan",
        "front": "Ano ang pagkakaiba ng **Pangkaming Pananaw** sa **Pantayong Pananaw**?",
        "back": "• **Pangkami**: Mula sa Pilipino tungo sa banyagang tagapakinig/mambabasa gamit ang banyagang wika (pagpapaliwanag sa iba).\n• **Pantayo**: Mula sa Pilipino para sa sariling kapwa Pilipino gamit ang wikang nauunawaan ng lahat sa loob ng sariling kultura.",
        "hint": "Sino ang kausap? Taga-labas o sariling kapwa Pilipino?"
      },
      {
        "id": "kas_03",
        "topic": "Tatlong Yugto",
        "front": "Ano ang **Tatlong Yugto ng Kasaysayan ng Kapilipinuhan** ayon sa Bagong Balangkas?",
        "back": "1. **Unang Yugto**: Pamayanan (bago ang 1588 / kolonyalismo)\n2. **Ikalawang Yugto**: Bayan (pagbuo ng kamalayang Pilipino noong ika-19 na dantaon hanggang Himagsikan)\n3. **Ikatlong Yugto**: Bansa (Republika at pangkalahatang kaisahan ng Kapilipinuhan).",
        "hint": "Pamayanan -> Bayan -> Bansa."
      },
      {
        "id": "kas_04",
        "topic": "Metodolohiya",
        "front": "Ano ang kaibahan ng **Primaryang Batis** sa **Sekondaryang Batis**?",
        "back": "• **Primaryang Batis**: Direktang ebidensya o saksi mula sa mismong panahong pinag-aaralan (e.g. talaarawan, liham, batas, artifacts, ulat ng saksi).\n• **Sekondaryang Batis**: Pagsusuri, interpretasyon, o pagtalakay batay sa mga primaryang batis (e.g. aklat-aralin, artikulong pangkasaysayan).",
        "hint": "Mismong saksi ba o komentaryo/pagsusuri lang pagkatapos ng pangyayari?"
      }
    ]
  },
  {
    "id": "deck_imfa_chem_flashcards",
    "subject": "General Chemistry",
    "tag": "Flashcard Deck",
    "color": "border-l-4 border-emerald-500",
    "title": "Intermolecular Forces & Physical Properties (Active Recall)",
    "desc": "Master London dispersion, dipole-dipole, hydrogen bonding, and their effects on boiling points and vapor pressure.",
    "cards": [
      {
        "id": "chem_01",
        "topic": "Intermolecular Forces",
        "front": "What is the primary condition required for **Hydrogen Bonding** to form between molecules?",
        "back": "A hydrogen atom covalently bonded to a strongly electronegative atom with small atomic radius ($\\text{N}$, $\\text{O}$, or $\\text{F}$) interacts with a lone pair on a nearby $\\text{N}$, $\\text{O}$, or $\\text{F}$ atom.",
        "hint": "Think of the acronym: FON (Fluorine, Oxygen, Nitrogen)."
      },
      {
        "id": "chem_02",
        "topic": "Dispersion Forces",
        "front": "How does molecular size / molar mass affect the strength of **London Dispersion Forces (LDF)**?",
        "back": "Larger molecules with higher molar mass have larger electron clouds, increasing **polarizability**, which produces stronger temporary dipoles and higher boiling points.",
        "hint": "More electrons = easier to distort the electron cloud."
      },
      {
        "id": "chem_03",
        "topic": "Ion-Dipole Forces",
        "front": "How do water ($\\text{H}_2\\text{O}$) molecules orient around a $\\text{Na}^+$ cation vs a $\\text{Cl}^-$ anion during hydration?",
        "back": "Around $\\text{Na}^+$, water orients its partially negative Oxygen atom ($\\delta^- \\text{O}$). Around $\\text{Cl}^-$, water orients its partially positive Hydrogen atoms ($\\delta^+ \\text{H}$).",
        "hint": "Opposite charges attract: $\\delta^-$ toward (+) and $\\delta^+$ toward (-)."
      },
      {
        "id": "chem_04",
        "topic": "Physical Properties",
        "front": "What is the relationship between Intermolecular Force (IMF) strength and **Vapor Pressure** at a given temperature?",
        "back": "**Inversely proportional**: Stronger IMFs $\\implies$ Fewer surface molecules can escape into gas phase $\\implies$ **Lower Vapor Pressure** (and Higher Boiling Point).",
        "hint": "If molecules stick tightly together, can they easily evaporate into vapor?"
      }
    ]
  }
];

export const STUDIO_DATA = {
  version: "1.9.4",
  updatedAt: new Date().toISOString(),
  announcement: "Materials authored via TagSci G11 Content Studio.",
  calendarEvents: [],
  stemReviewers: [],
  studyMaterials: [],
  problemSets: [],
  flashcardDecks: JSON.parse(JSON.stringify(DEFAULT_FLASHCARD_DECKS)),
  quizSets: JSON.parse(JSON.stringify(DEFAULT_FLASHCARD_DECKS))
};

export let currentRevIndex = 0;
export let currentMatIndex = 0;
export let currentDeckIndex = 0;
export let currentQuizSetIndex = 0; // Backwards-compatible alias
export let currentEditorMode = 'visual';

export function setCurrentRevIndex(idx) { currentRevIndex = idx; }
export function setCurrentMatIndex(idx) { currentMatIndex = idx; }
export function setCurrentDeckIndex(idx) { currentDeckIndex = idx; currentQuizSetIndex = idx; }
export function setCurrentQuizSetIndex(idx) { currentDeckIndex = idx; currentQuizSetIndex = idx; }
export function setCurrentEditorMode(mode) { currentEditorMode = mode; }

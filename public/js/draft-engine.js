// Master Draft Sequence (20-Step Snake Draft)
const DRAFT_SEQUENCE = [
    { turn: 1,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 2,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 3,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 4,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 5,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 6,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },

    { turn: 7,  phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 8,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 9,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 10, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 11, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 12, phase: 'Pick Phase 1', action: 'pick', team: 'B' },

    { turn: 13, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 14, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },
    { turn: 15, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 16, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },

    { turn: 17, phase: 'Pick Phase 2', action: 'pick', team: 'B' },
    { turn: 18, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 19, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 20, phase: 'Pick Phase 2', action: 'pick', team: 'B' }
];

let draftState = {
    version: 0,
    currentTurnIndex: 0,
    isComplete: false,
    started: false,
    bans: { A: [], B: [] },
    picks: { A: [], B: [] },
    draftLog: []
};

const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];

// =========================================================================
// EXPANDED COMPETITIVE MLBB COUNTER RELATIONSHIP DATASET
// Logic: Kit denials, mechanical counters, anti-mechanics, suppression & range advantages
// =========================================================================
const COUNTER_DATA = {
  "Aamon": {
    "counteredBy": ["Ruby", "Saber", "Kaja", "Franco", "Eudora", "Khufra", "Chou", "Lolita", "Gusion", "Belerick"]
  },
  "Akai": {
    "counteredBy": ["Diggie", "Valir", "Karrie", "Claude", "Wanwan", "Lunox", "X.Borg", "Moskov", "Gusion"]
  },
  "Aldous": {
    "counteredBy": ["Akai", "Franco", "Kaja", "Valir", "Lunox", "Mawia", "Chou", "Grock", "Esmeralda", "Jawhead", "Ruby"]
  },
  "Alice": {
    "counteredBy": ["Baxia", "Karrie", "Dyrroth", "Valir", "Lunox", "Claude", "X.Borg", "Franco", "Kaja", "Silvanna"]
  },
  "Alpha": {
    "counteredBy": ["Baxia", "Valir", "Karrie", "Claude", "Kaja", "Franco", "Dyrroth", "Lunox", "Phoveus", "Ruby"]
  },
  "Alucard": {
    "counteredBy": ["Khufra", "Franco", "Kaja", "Baxia", "Saber", "Minsitthar", "Phoveus", "Chou", "Valir", "Eudora"]
  },
  "Angela": {
    "counteredBy": ["Faramis", "Baxia", "Saber", "Natalia", "Chou", "Lancelot", "Hayabusa", "Helcurt", "Kaja", "Franco"]
  },
  "Argus": {
    "counteredBy": ["Franco", "Kaja", "Valir", "Akai", "Ruby", "Chou", "Diggie", "Belerick", "Grock", "Jawhead"]
  },
  "Arlott": {
    "counteredBy": ["Phoveus", "Minsitthar", "Khufra", "Diggie", "Franco", "Kaja", "Ruby", "Valir", "Belerick"]
  },
  "Atlas": {
    "counteredBy": ["Diggie", "Valir", "Akai", "Kadita", "Wanwan", "Claude", "Karrie", "Lunox", "Chou", "Franco"]
  },
  "Aulus": {
    "counteredBy": ["Valir", "Franco", "Kaja", "Karrie", "Claude", "Baxia", "Dyrroth", "Lunox", "Saber", "Phoveus"]
  },
  "Aurora": {
    "counteredBy": ["Helcurt", "Saber", "Lancelot", "Hayabusa", "Chou", "Ling", "Fanny", "Natalia", "Joy", "Benedetta"]
  },
  "Badang": {
    "counteredBy": ["Chou", "Diggie", "Wanwan", "Benedetta", "Ruby", "Khufra", "Franco", "Kaja", "Lancelot", "Hayabusa"]
  },
  "Balmond": {
    "counteredBy": ["Valir", "Baxia", "Karrie", "Dyrroth", "Lunox", "Claude", "X.Borg", "Franco", "Kaja", "Sun"]
  },
  "Bane": {
    "counteredBy": ["Chou", "Saber", "Hayabusa", "Lancelot", "Valir", "Ling", "Fanny", "Natalia", "Kaja", "Franco"]
  },
  "Barats": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "Claude", "Dyrroth", "Baxia", "X.Borg", "Wanwan", "Diggie", "Gord"]
  },
  "Baxia": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "X.Borg", "Claude", "Dyrroth", "Sun", "Gord", "Wanwan"]
  },
  "Beatrix": {
    "counteredBy": ["Saber", "Chou", "Hayabusa", "Lancelot", "Natalia", "Ling", "Fanny", "Helcurt", "Kaja", "Franco", "Joy"]
  },
  "Belerick": {
    "counteredBy": ["Karrie", "Lunox", "Dyrroth", "Valir", "Claude", "X.Borg", "Baxia", "Gord", "Wanwan"]
  },
  "Benedetta": {
    "counteredBy": ["Minsitthar", "Phoveus", "Khufra", "Kaja", "Franco", "Ruby", "Saber", "Eudora", "Chou", "Belerick"]
  },
  "Brody": {
    "counteredBy": ["Hayabusa", "Lancelot", "Saber", "Chou", "Ling", "Fanny", "Natalia", "Joy", "Helcurt", "Kaja"]
  },
  "Bruno": {
    "counteredBy": ["Lolita", "Belerick", "Grock", "Hayabusa", "Chou", "Lancelot", "Saber", "Franco", "Kaja", "Khufra"]
  },
  "Carmilla": {
    "counteredBy": ["Diggie", "Valir", "Karrie", "Wanwan", "Baxia", "Lunox", "Claude", "X.Borg", "Akai", "Franco"]
  },
  "Cecilion": {
    "counteredBy": ["Helcurt", "Hayabusa", "Lancelot", "Ling", "Chou", "Saber", "Fanny", "Natalia", "Joy", "Gusion", "Kaja"]
  },
  "Chang'e": {
    "counteredBy": ["Lolita", "Lancelot", "Hayabusa", "Ling", "Chou", "Saber", "Fanny", "Gusion", "Khufra", "Belerick", "Joy"]
  },
  "Chip": {
    "counteredBy": ["Diggie", "Valir", "Luo Yi", "Vexana", "Faramis", "Akai", "Franco", "Kaja", "Baxia"]
  },
  "Chou": {
    "counteredBy": ["Diggie", "Phoveus", "Kaja", "Franco", "Khufra", "Minsitthar", "Ruby", "Belerick", "Akai", "Grock"]
  },
  "Cici": {
    "counteredBy": ["Baxia", "Dyrroth", "Kaja", "Franco", "Valir", "Karrie", "Lunox", "Chou", "Saber", "Phoveus"]
  },
  "Claude": {
    "counteredBy": ["Belerick", "Saber", "Kaja", "Franco", "Diggie", "Khufra", "Chou", "Eudora", "Aurora", "Grock"]
  },
  "Clint": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Natalia", "Kaja", "Franco"]
  },
  "Cyclops": {
    "counteredBy": ["Lolita", "Lancelot", "Hayabusa", "Chou", "Saber", "Ling", "Helcurt", "Fanny", "Natalia", "Baxia"]
  },
  "Diggie": {
    "counteredBy": ["Guinevere", "Chou", "Saber", "Helcurt", "Natalia", "Lancelot", "Hayabusa", "Ling", "Fanny", "Kaja"]
  },
  "Dyrroth": {
    "counteredBy": ["Valir", "Thamuz", "Freya", "Karrie", "Lunox", "Claude", "Chou", "Franco", "Kaja", "Ruby"]
  },
  "Edith": {
    "counteredBy": ["Karrie", "Lunox", "Dyrroth", "Valir", "Claude", "Baxia", "X.Borg", "Wanwan", "Diggie"]
  },
  "Esmeralda": {
    "counteredBy": ["Baxia", "Dyrroth", "Karrie", "Lunox", "Valir", "Claude", "X.Borg", "Kaja", "Franco", "Thamuz"]
  },
  "Estes": {
    "counteredBy": ["Baxia", "Luo Yi", "Faramis", "Atlas", "Carmilla", "Akai", "Vexana", "Franco", "Kaja", "Saber"]
  },
  "Eudora": {
    "counteredBy": ["Lolita", "Lancelot", "Hayabusa", "Chou", "Ling", "Helcurt", "Fanny", "Natalia", "Benedetta", "Joy"]
  },
  "Fanny": {
    "counteredBy": ["Khufra", "Minsitthar", "Eudora", "Saber", "Franco", "Kaja", "Moskov", "Ruby", "Akai", "Chou", "Phoveus"]
  },
  "Faramis": {
    "counteredBy": ["Valentina", "Baxia", "Luo Yi", "Akai", "Diggie", "Kaja", "Franco", "Atlas", "Carmilla"]
  },
  "Floryn": {
    "counteredBy": ["Baxia", "Saber", "Hayabusa", "Helcurt", "Natalia", "Lancelot", "Ling", "Fanny", "Chou", "Kaja"]
  },
  "Franco": {
    "counteredBy": ["Diggie", "Sun", "Popol and Kupa", "Zhask", "Grock", "Akai", "Belerick", "Khufra", "Hylos", "Atlas"]
  },
  "Fredrinn": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "Baxia", "Dyrroth", "Claude", "X.Borg", "Wanwan", "Diggie"]
  },
  "Freya": {
    "counteredBy": ["Valir", "Baxia", "Khufra", "Karrie", "Dyrroth", "Franco", "Kaja", "Akai", "Lunox", "Ruby"]
  },
  "Gatotkaca": {
    "counteredBy": ["Karrie", "Lunox", "Dyrroth", "Valir", "Diggie", "Claude", "X.Borg", "Wanwan", "Baxia"]
  },
  "Gloo": {
    "counteredBy": ["Faramis", "Vexana", "Claude", "Valir", "Baxia", "Sun", "Ruby", "Diggie", "Alpha", "Grock"]
  },
  "Gord": {
    "counteredBy": ["Chou", "Lancelot", "Hayabusa", "Ling", "Saber", "Fanny", "Natalia", "Helcurt", "Joy", "Kaja", "Franco"]
  },
  "Granger": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Belerick", "Natalia", "Kaja"]
  },
  "Grock": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "X.Borg", "Diggie", "Claude", "Dyrroth", "Baxia", "Wanwan"]
  },
  "Guinevere": {
    "counteredBy": ["Diggie", "Helcurt", "Chou", "Wanwan", "Ruby", "Kaja", "Franco", "Benedetta", "Akai", "Khufra"]
  },
  "Gusion": {
    "counteredBy": ["Lolita", "Minsitthar", "Khufra", "Ruby", "Saber", "Kaja", "Franco", "Eudora", "Chou", "Phoveus"]
  },
  "Hanabi": {
    "counteredBy": ["Lolita", "Belerick", "Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Khufra"]
  },
  "Hanzo": {
    "counteredBy": ["Ling", "Natalia", "Hayabusa", "Lancelot", "Fanny", "Saber", "Chou", "Joy", "Helcurt", "Benedetta"]
  },
  "Harith": {
    "counteredBy": ["Minsitthar", "Phoveus", "Khufra", "Kaja", "Franco", "Saber", "Eudora", "Ruby", "Belerick", "Valir"]
  },
  "Harley": {
    "counteredBy": ["Lolita", "Hayabusa", "Saber", "Chou", "Ling", "Lancelot", "Kaja", "Franco", "Eudora", "Ruby"]
  },
  "Hayabusa": {
    "counteredBy": ["Saber", "Kaja", "Franco", "Khufra", "Ruby", "Chou", "Phoveus", "Minsitthar", "Eudora", "Jawhead"]
  },
  "Helcurt": {
    "counteredBy": ["Kaja", "Franco", "Ruby", "Hylos", "Belerick", "Chou", "Akai", "Khufra", "Saber", "Jawhead"]
  },
  "Hilda": {
    "counteredBy": ["Karrie", "Valir", "Dyrroth", "Baxia", "Lunox", "Claude", "X.Borg", "Franco", "Kaja", "Ruby"]
  },
  "Hirara": {
    "counteredBy": ["Baxia", "Franco", "Kaja", "Saber", "Valir", "Karrie", "Lunox", "Dyrroth", "Chou"]
  },
  "Hylos": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "Dyrroth", "Baxia", "Claude", "X.Borg", "Wanwan", "Diggie"]
  },
  "Irithel": {
    "counteredBy": ["Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Kaja", "Franco", "Lolita"]
  },
  "Ixia": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Natalia", "Kaja", "Franco", "Khufra"]
  },
  "Jawhead": {
    "counteredBy": ["Valir", "Karrie", "Diggie", "Ruby", "Franco", "Kaja", "Chou", "Akai", "Khufra", "Dyrroth"]
  },
  "Johnson": {
    "counteredBy": ["Diggie", "Belerick", "Grock", "Akai", "Claude", "Karrie", "Baxia", "Atlas", "Franco"]
  },
  "Joy": {
    "counteredBy": ["Minsitthar", "Phoveus", "Khufra", "Franco", "Kaja", "Saber", "Ruby", "Eudora", "Chou", "Belerick"]
  },
  "Julian": {
    "counteredBy": ["Valir", "Saber", "Kaja", "Franco", "Chou", "Ruby", "Khufra", "Eudora", "Dyrroth", "Phoveus"]
  },
  "Kadita": {
    "counteredBy": ["Lolita", "Diggie", "Chou", "Lancelot", "Ruby", "Kaja", "Franco", "Wanwan", "Akai", "Khufra"]
  },
  "Kagura": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Helcurt", "Fanny", "Franco", "Kaja", "Joy"]
  },
  "Kaja": {
    "counteredBy": ["Diggie", "Valir", "Grock", "Akai", "Zhask", "Popol and Kupa", "Sun", "Belerick", "Khufra"]
  },
  "Kalea": {
    "counteredBy": ["Baxia", "Karrie", "Valir", "Saber", "Dyrroth", "Lunox", "Claude", "Franco", "Kaja"]
  },
  "Karina": {
    "counteredBy": ["Lunox", "Eudora", "Kaja", "Franco", "Ruby", "Saber", "Chou", "Khufra", "Valir", "Baxia"]
  },
  "Karrie": {
    "counteredBy": ["Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Kaja", "Franco", "Helcurt"]
  },
  "Khaleed": {
    "counteredBy": ["Valir", "Baxia", "Chou", "Dyrroth", "Ruby", "Franco", "Kaja", "Karrie", "Lunox", "Akai"]
  },
  "Khufra": {
    "counteredBy": ["Diggie", "Valir", "Karrie", "Claude", "Wanwan", "Lunox", "Franco", "Kaja", "X.Borg", "Akai"]
  },
  "Kimmy": {
    "counteredBy": ["Lolita", "Belerick", "Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Khufra"]
  },
  "Lancelot": {
    "counteredBy": ["Khufra", "Minsitthar", "Phoveus", "Kaja", "Franco", "Ruby", "Saber", "Eudora", "Chou", "Belerick"]
  },
  "Lapu-Lapu": {
    "counteredBy": ["Valir", "Dyrroth", "Karrie", "Thamuz", "Lunox", "Claude", "Baxia", "Franco", "Kaja", "Ruby"]
  },
  "Layla": {
    "counteredBy": ["Hayabusa", "Lancelot", "Saber", "Chou", "Ling", "Fanny", "Natalia", "Helcurt", "Joy", "Kaja", "Franco", "Khufra"]
  },
  "Leomord": {
    "counteredBy": ["Valir", "Dyrroth", "Karrie", "Akai", "Baxia", "Franco", "Kaja", "Lunox", "Claude", "Ruby"]
  },
  "Lesley": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Ling": {
    "counteredBy": ["Khufra", "Minsitthar", "Ruby", "Kaja", "Franco", "Saber", "Eudora", "Chou", "Phoveus", "Akai"]
  },
  "Lolita": {
    "counteredBy": ["Grock", "Chou", "Kaja", "Franco", "Akai", "Diggie", "Jawhead", "Ruby", "Khufra", "Baxia"]
  },
  "Lukas": {
    "counteredBy": ["Karrie", "Valir", "Baxia", "Dyrroth", "Lunox", "Claude", "Franco", "Kaja", "Saber"]
  },
  "Lunox": {
    "counteredBy": ["Chou", "Lancelot", "Hayabusa", "Saber", "Ling", "Fanny", "Helcurt", "Natalia", "Kaja", "Franco", "Joy"]
  },
  "Luo Yi": {
    "counteredBy": ["Lancelot", "Hayabusa", "Chou", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Lylia": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Kaja", "Franco", "Joy"]
  },
  "Marcel": {
    "counteredBy": ["Baxia", "Karrie", "Valir", "Saber", "Kaja", "Franco", "Dyrroth", "Lunox", "Claude","Obsidia"]
  },
  "Martis": {
    "counteredBy": ["Valir", "Karrie", "Dyrroth", "Phoveus", "Franco", "Kaja", "Baxia", "Lunox", "Claude", "Ruby"]
  },
  "Masha": {
    "counteredBy": ["Baxia", "Valir", "Claude", "Wanwan", "Akai", "Dyrroth", "Karrie", "Lunox", "Ruby", "Franco"]
  },
  "Mathilda": {
    "counteredBy": ["Phoveus", "Minsitthar", "Khufra", "Saber", "Kaja", "Franco", "Eudora", "Ruby", "Chou", "Valir"]
  },
  "Melissa": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Natalia", "Kaja", "Franco", "Khufra"]
  },
  "Minotaur": {
    "counteredBy": ["Diggie", "Valir", "Karrie", "Claude", "Wanwan", "Lunox", "Franco", "Kaja", "Akai", "Grock"]
  },
  "Minsitthar": {
    "counteredBy": ["Diggie", "Valir", "Karrie", "Claude", "Lunox", "X.Borg", "Wanwan", "Franco", "Kaja", "Akai"]
  },
  "Miya": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Kaja", "Franco", "Khufra"]
  },
  "Moskov": {
    "counteredBy": ["Lolita", "Belerick", "Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Khufra", "Franco"]
  },
  "Nana": {
    "counteredBy": ["Lancelot", "Hayabusa", "Chou", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Natalia": {
    "counteredBy": ["Hylos", "Rafaela", "Yi Sun-shin", "Aldous", "Popol and Kupa", "Kaja", "Franco", "Belerick", "Ruby", "Saber"]
  },
  "Natan": {
    "counteredBy": ["Lolita", "Hayabusa", "Lancelot", "Chou", "Ling", "Saber", "Fanny", "Natalia", "Kaja", "Franco", "Khufra"]
  },
  "Nolan": {
    "counteredBy": ["Khufra", "Minsitthar", "Phoveus", "Kaja", "Franco", "Ruby", "Saber", "Eudora", "Chou", "Belerick"]
  },
  "Novaria": {
    "counteredBy": ["Ling", "Hayabusa", "Lancelot", "Chou", "Saber", "Fanny", "Natalia", "Joy", "Helcurt", "Kaja"]
  },
  "Obsidia": {
    "counteredBy": ["Karrie", "Lunox", "Valir", "Baxia", "Dyrroth", "Claude", "Franco", "Kaja", "Saber"]
  },
  "Odette": {
    "counteredBy": ["Chou", "Jawhead", "Kaja", "Franco", "Ruby", "Saber", "Eudora", "Khufra", "Akai", "Valir", "Diggie"]
  },
  "Paquito": {
    "counteredBy": ["Phoveus", "Minsitthar", "Khufra", "Kaja", "Franco", "Ruby", "Saber", "Chou", "Valir", "Belerick"]
  },
  "Pharsa": {
    "counteredBy": ["Lancelot", "Hayabusa", "Chou", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Phoveus": {
    "counteredBy": ["Karrie", "Lunox", "Dyrroth", "Baxia", "Valir", "Claude", "X.Borg", "Franco", "Kaja", "Wanwan"]
  },
  "Popol and Kupa": {
    "counteredBy": ["Luo Yi", "Claude", "Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Khufra"]
  },
  "Rafaela": {
    "counteredBy": ["Saber", "Hayabusa", "Lancelot", "Helcurt", "Chou", "Ling", "Fanny", "Natalia", "Kaja", "Franco"]
  },
  "Roger": {
    "counteredBy": ["Baxia", "Valir", "Karrie", "Dyrroth", "Ruby", "Franco", "Kaja", "Lunox", "Claude", "Khufra"]
  },
  "Ruby": {
    "counteredBy": ["Baxia", "Valir", "Karrie", "Dyrroth", "Phoveus", "Franco", "Kaja", "Lunox", "Claude", "Diggie"]
  },
  "Saber": {
    "counteredBy": ["Diggie", "Grock", "Akai", "Khufra", "Belerick", "Ruby", "Chou", "Franco", "Kaja", "Jawhead"]
  },
  "Selena": {
    "counteredBy": ["Diggie", "Lolita", "Kagura", "Hayabusa", "Chou", "Lancelot", "Ling", "Saber", "Franco", "Kaja"]
  },
  "Silvanna": {
    "counteredBy": ["Diggie", "Chou", "Akai", "Valir", "Ruby", "Franco", "Kaja", "Khufra", "Jawhead", "Wanwan"]
  },
  "Sora": {
    "counteredBy": ["Baxia", "Dyrroth", "Valir", "Karrie", "Lunox", "Claude", "Franco", "Kaja", "Saber"]
  },
  "Sun": {
    "counteredBy": ["Faramis", "Luo Yi", "Baxia", "Odette", "Ruby", "Claude", "Gloo", "Alpha", "Terizla", "Balmond"]
  },
  "Suyou": {
    "counteredBy": ["Khufra", "Minsitthar", "Kaja", "Franco", "Valir", "Ruby", "Saber", "Chou", "Phoveus", "Eudora"]
  },
  "Terizla": {
    "counteredBy": ["Valir", "Karrie", "Dyrroth", "Lunox", "Claude", "X.Borg", "Baxia", "Wanwan", "Diggie", "Franco"]
  },
  "Thamuz": {
    "counteredBy": ["Valir", "Baxia", "Karrie", "Dyrroth", "Lunox", "Claude", "X.Borg", "Franco", "Kaja", "Ruby"]
  },
  "Tigreal": {
    "counteredBy": ["Diggie", "Valir", "Akai", "Wanwan", "Claude", "Karrie", "Lunox", "Franco", "Kaja", "Grock"]
  },
  "Uranus": {
    "counteredBy": ["Baxia", "Karrie", "Dyrroth", "Lunox", "Valir", "Claude", "X.Borg", "Sun", "Gord", "Wanwan","Esmeralda"]
  },
  "Valentina": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Kaja", "Franco"]
  },
  "Vale": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Valir": {
    "counteredBy": ["Lancelot", "Hayabusa", "Chou", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Benedetta", "Kaja"]
  },
  "Vexana": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Wanwan": {
    "counteredBy": ["Phoveus", "Khufra", "Kaja", "Franco", "Lolita", "Minsitthar", "Belerick", "Saber", "Eudora", "Chou"]
  },
  "X.Borg": {
    "counteredBy": ["Baxia", "Dyrroth", "Karrie", "Lunox", "Valir", "Claude", "Hayabusa", "Chou", "Franco", "Kaja"]
  },
  "Xavier": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Yi Sun-shin": {
    "counteredBy": ["Hayabusa", "Lancelot", "Chou", "Saber", "Ling", "Fanny", "Natalia", "Kaja", "Franco", "Khufra"]
  },
  "Yin": {
    "counteredBy": ["Diggie", "Valir", "Akai", "Wanwan", "Ruby", "Chou", "Franco", "Kaja", "Khufra", "Belerick"]
  },
  "Yu Zhong": {
    "counteredBy": ["Baxia", "Valir", "Karrie", "Dyrroth", "Lunox", "Claude", "X.Borg", "Franco", "Kaja", "Ruby"]
  },
  "Yve": {
    "counteredBy": ["Lancelot", "Hayabusa", "Chou", "Ling", "Kaja", "Franco", "Saber", "Fanny", "Helcurt", "Joy"]
  },
  "Zetian": {
    "counteredBy": ["Chou", "Hayabusa", "Lancelot", "Ling", "Saber", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja"]
  },
  "Zhask": {
    "counteredBy": ["Claude", "Luo Yi", "Faramis", "Hayabusa", "Lancelot", "Ling", "Chou", "Saber", "Baxia", "Sun"]
  },
  "Zhuxin": {
    "counteredBy": ["Lancelot", "Hayabusa", "Ling", "Saber", "Chou", "Fanny", "Helcurt", "Natalia", "Joy", "Kaja", "Franco"]
  },
  "Zilong": {
    "counteredBy": ["Valir", "Ruby", "Akai", "Grock", "Belerick", "Khufra", "Chou", "Franco", "Kaja", "Phoveus"]
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COUNTER_DATA };
}

function getCurrentTurn() {
    if (!draftState || draftState.currentTurnIndex >= DRAFT_SEQUENCE.length) return null;
    return DRAFT_SEQUENCE[draftState.currentTurnIndex];
}

function isHeroUnavailable(heroId) {
    if (!draftState) return false;
    const isBanned = [...(draftState.bans?.A || []), ...(draftState.bans?.B || [])].filter(Boolean).some(h => h.id === heroId);
    const isPicked = [...(draftState.picks?.A || []), ...(draftState.picks?.B || [])].filter(Boolean).some(h => h.id === heroId);
    return isBanned || isPicked;
}

function getTeamOpenLanes(picks) {
    const activeHeroes = (picks || []).filter(Boolean);
    if (activeHeroes.length === 0) return [...ALL_LANES];

    const singleRoleOccupied = new Set();
    activeHeroes.forEach(hero => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        if (lanes.length === 1) {
            singleRoleOccupied.add(lanes[0]);
        }
    });

    let maxCoverage = new Set(singleRoleOccupied);

    function backtrack(idx, currentAssignment) {
        if (idx === activeHeroes.length) {
            if (currentAssignment.size > maxCoverage.size) {
                maxCoverage = new Set(currentAssignment);
            }
            return;
        }

        const hero = activeHeroes[idx];
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);

        for (const lane of lanes) {
            if (!currentAssignment.has(lane)) {
                currentAssignment.add(lane);
                backtrack(idx + 1, currentAssignment);
                currentAssignment.delete(lane);
            }
        }
        backtrack(idx + 1, currentAssignment);
    }

    backtrack(0, new Set(singleRoleOccupied));
    return ALL_LANES.filter(l => !maxCoverage.has(l));
}

function getHeroCounters(heroName) {
    return (COUNTER_DATA[heroName] && COUNTER_DATA[heroName].counteredBy) || [];
}

/**
 * Enhanced Recommendation Engine with Multi-Counter Intelligence (v2)
 */
function getRecommendations() {
    const turn = getCurrentTurn();
    if (!turn || draftState.isComplete) {
        return { type: 'complete', list: [], neededLanes: [] };
    }

    const availableHeroes = HERO_DATASET.filter(h => !isHeroUnavailable(h.id));
    const activeTeam = turn.team;
    const opponentTeam = activeTeam === 'A' ? 'B' : 'A';

    const myPicks = (draftState.picks[activeTeam] || []).filter(Boolean);
    const oppPicks = (draftState.picks[opponentTeam] || []).filter(Boolean);

    const myOpenLanes = getTeamOpenLanes(myPicks);
    const oppOpenLanes = getTeamOpenLanes(oppPicks);

    // 1. BAN RECOMMENDATIONS (Multi-Target Protective Ban Boost >= 2 + Lane Denial)
    if (turn.action === 'ban') {
        let banCandidates = availableHeroes;

        if (oppOpenLanes.length > 0 && oppOpenLanes.length < 5) {
            const laneDenialCandidates = availableHeroes.filter(hero => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                return lanes.some(l => oppOpenLanes.includes(l));
            });
            if (laneDenialCandidates.length > 0) {
                banCandidates = laneDenialCandidates;
            }
        }

        const sorted = [...banCandidates].sort((a, b) => {
            const calculateBanScore = (hero) => {
                const baseBanRate = (typeof getHeroBanRate === 'function' ? getHeroBanRate(hero) : (hero.banRate || 0));
                const basePickRate = (typeof getHeroPickRate === 'function' ? getHeroPickRate(hero) : (hero.pickRate || 0));
                let score = (baseBanRate * 0.7) + (basePickRate * 0.3);

                let threatenedPickCount = 0;
                myPicks.forEach(myHero => {
                    const countersToMyHero = getHeroCounters(myHero.name);
                    if (countersToMyHero.includes(hero.name)) {
                        threatenedPickCount++;
                    }
                });

                if (threatenedPickCount >= 2) {
                    score *= (1.5 + (threatenedPickCount * 0.25));
                }

                return score;
            };

            return calculateBanScore(b) - calculateBanScore(a);
        });

        return {
            type: 'ban',
            list: sorted.slice(0, 6),
            neededLanes: oppOpenLanes
        };
    }

    // 2. PICK RECOMMENDATIONS (Multi-Target Counter Boost >= 2 & Risk Filter >= 3)
    if (turn.action === 'pick') {
        let pickCandidates = availableHeroes;

        if (myOpenLanes.length > 0) {
            const laneMatchingCandidates = availableHeroes.filter(hero => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                return lanes.some(l => myOpenLanes.includes(l));
            });
            if (laneMatchingCandidates.length > 0) {
                pickCandidates = laneMatchingCandidates;
            }
        }

        const safeCandidates = pickCandidates.filter(hero => {
            const counters = getHeroCounters(hero.name);
            const liveCounterCount = counters.filter(cName => {
                const found = HERO_DATASET.find(h => h.name.toLowerCase() === cName.toLowerCase());
                return found && !isHeroUnavailable(found.id);
            }).length;

            return liveCounterCount < 3;
        });

        const finalCandidates = safeCandidates.length > 0 ? safeCandidates : pickCandidates;

        const sorted = [...finalCandidates].sort((a, b) => {
            const calculatePickScore = (hero) => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                const matchingOpen = lanes.filter(l => myOpenLanes.includes(l));
                let roleScore = (typeof getHeroPickRate === 'function') ? getHeroPickRate(hero) : (hero.pickRate || 0);

                matchingOpen.forEach(lane => {
                    if (hero.roles && hero.roles[lane]) {
                        roleScore = Math.max(roleScore, hero.roles[lane].pickRate || 0);
                    }
                });

                let counteredEnemyCount = 0;
                oppPicks.forEach(oppHero => {
                    const countersToEnemy = getHeroCounters(oppHero.name);
                    if (countersToEnemy.includes(hero.name)) {
                        counteredEnemyCount++;
                    }
                });

                if (counteredEnemyCount >= 2) {
                    roleScore *= (1.6 + (counteredEnemyCount * 0.3));
                }

                return roleScore;
            };

            return calculatePickScore(b) - calculatePickScore(a);
        });

        return {
            type: 'pick',
            list: sorted.slice(0, 6),
            neededLanes: myOpenLanes
        };
    }

    return { type: 'complete', list: [], neededLanes: [] };
}

function evaluateTeamDraft(picks) {
    if (!picks || picks.length === 0) {
        return { score: 0, breakdown: [{ text: "No heroes selected", type: "neg" }], coveredLanes: [] };
    }

    const safePicks = picks.filter(Boolean);
    const breakdown = [];
    let score = 0;

    const avgWinRate = safePicks.length ? safePicks.reduce((sum, h) => sum + (h.winRate || 50), 0) / safePicks.length : 50;
    const metaPts = Math.min(30, Math.round((avgWinRate - 45) * 4));
    score += metaPts;
    breakdown.push({ text: `Meta Win-Rate Rating: +${metaPts} pts (avg ${avgWinRate.toFixed(1)}%)`, type: "pos" });

    const openLanes = getTeamOpenLanes(safePicks);
    const coveredCount = 5 - openLanes.length;
    const coveragePts = coveredCount * 8;
    score += coveragePts;
    breakdown.push({ text: `Lane Coverage: +${coveragePts} pts (${coveredCount}/5 unique roles)`, type: "pos" });

    if (coveredCount >= 5) {
        score += 20;
        breakdown.push({ text: "Full 5-Role Balanced Lineup Bonus: +20 pts", type: "pos" });
    } else {
        score -= 15;
        breakdown.push({ text: `Missing Required Roles (${openLanes.join(', ')}): -15 pts`, type: "neg" });
    }

    const spikes = safePicks.map(h => h.powerSpike || "Mid");
    const hasLate = spikes.includes("Late") || spikes.includes("All");
    const hasEarly = spikes.includes("Early") || spikes.includes("All");
    if (hasLate && hasEarly) {
        score += 10;
        breakdown.push({ text: "Balanced Scaling Curve (Early + Late Spikes): +10 pts", type: "pos" });
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score: score,
        breakdown: breakdown,
        coveredLanes: ALL_LANES.filter(l => !openLanes.includes(l))
    };
}

function evaluateDraftComparison(picksA, bansA, picksB, bansB) {
    const safeA = (picksA || []).filter(Boolean);
    const safeB = (picksB || []).filter(Boolean);
    const safeBansA = (bansA || []).filter(Boolean);
    const safeBansB = (bansB || []).filter(Boolean);

    function getDamageProfile(picks) {
        let magic = 0, physical = 0;
        picks.forEach(hero => {
            const classes = (typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []);
            if (classes.includes('Mage')) magic += 1.5;
            if (classes.includes('Support')) magic += 0.5;
            if (classes.includes('Marksman') || classes.includes('Assassin')) physical += 1.5;
            if (classes.includes('Fighter')) physical += 1.0;
        });
        const isBalanced = magic >= 1.5 && physical >= 2.0;
        return { magic, physical, isBalanced };
    }

    function getPowerCurve(picks) {
        let early = 0, mid = 0, late = 0;
        picks.forEach(h => {
            if (h.powerSpike === 'Early') early++;
            else if (h.powerSpike === 'Late') late++;
            else mid++;
        });
        return { early, mid, late };
    }

    const openLanesA = getTeamOpenLanes(safeA);
    const openLanesB = getTeamOpenLanes(safeB);
    const laneCountA = 5 - openLanesA.length;
    const laneCountB = 5 - openLanesB.length;

    const avgWinRateA = safeA.length ? safeA.reduce((sum, h) => sum + (h.winRate || 50), 0) / safeA.length : 50;
    const avgWinRateB = safeB.length ? safeB.reduce((sum, h) => sum + (h.winRate || 50), 0) / safeB.length : 50;

    const classesA = new Set(safeA.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classesB = new Set(safeB.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classCountA = classesA.size;
    const classCountB = classesB.size;

    const dmgA = getDamageProfile(safeA);
    const dmgB = getDamageProfile(safeB);

    const engageCountA = safeA.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;
    const engageCountB = safeB.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;

    // Track multi-role heroes using the current iteration value to avoid runtime errors in the category comparison.
    const flexCountA = safeA.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;
    const flexCountB = safeB.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;

    const curveA = getPowerCurve(safeA);
    const curveB = getPowerCurve(safeB);
    const curveScoreA = (curveA.early >= 1 ? 1 : 0) + (curveA.mid >= 1 ? 1 : 0) + (curveA.late >= 1 ? 1 : 0);
    const curveScoreB = (curveB.early >= 1 ? 1 : 0) + (curveB.mid >= 1 ? 1 : 0) + (curveB.late >= 1 ? 1 : 0);

    const banEffA = safeBansA.reduce((sum, h) => sum + (h.banRate || 0), 0);
    const banEffB = safeBansB.reduce((sum, h) => sum + (h.banRate || 0), 0);

    let scoreA = Math.round((laneCountA * 6) + (avgWinRateA * 0.7) + (classCountA * 3) + (dmgA.isBalanced ? 10 : 4) + (engageCountA >= 1 ? 8 : 2) + (flexCountA * 2) + (curveScoreA * 3));
    let scoreB = Math.round((laneCountB * 6) + (avgWinRateB * 0.7) + (classCountB * 3) + (dmgB.isBalanced ? 10 : 4) + (engageCountB >= 1 ? 8 : 2) + (flexCountB * 2) + (curveScoreB * 3));
    scoreA = Math.min(100, Math.max(30, scoreA));
    scoreB = Math.min(100, Math.max(30, scoreB));

    const categories = [
        {
            name: "Lane Coverage",
            desc: "Map position coverage across EXP, Jungle, Mid, Gold, and Roam",
            statA: `${laneCountA}/5 Covered`,
            statB: `${laneCountB}/5 Covered`,
            winner: laneCountA > laneCountB ? 'A' : (laneCountB > laneCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Meta Strength",
            desc: "Average baseline win rate across locked heroes",
            statA: `${avgWinRateA.toFixed(1)}% WR`,
            statB: `${avgWinRateB.toFixed(1)}% WR`,
            winner: avgWinRateA > avgWinRateB + 0.2 ? 'A' : (avgWinRateB > avgWinRateA + 0.2 ? 'B' : 'EQUAL')
        },
        {
            name: "Role Balance",
            desc: "Distribution across standard MLBB combat classes",
            statA: `${classCountA} Classes`,
            statB: `${classCountB} Classes`,
            winner: classCountA > classCountB ? 'A' : (classCountB > classCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Damage Type",
            desc: "Hybrid split of physical burst and continuous magic power",
            statA: dmgA.isBalanced ? "Balanced Split" : "Heavy Biased",
            statB: dmgB.isBalanced ? "Balanced Split" : "Heavy Biased",
            winner: dmgA.isBalanced && !dmgB.isBalanced ? 'A' : (dmgB.isBalanced && !dmgA.isBalanced ? 'B' : 'EQUAL')
        },
        {
            name: "Engage / Utility",
            desc: "Crowd control frontline and supportive sustain capacity",
            statA: `${engageCountA} Utility/Tank`,
            statB: `${engageCountB} Utility/Tank`,
            winner: engageCountA > engageCountB ? 'A' : (engageCountB > engageCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Flexibility",
            desc: "Lineup flex capacity to adapt lanes and counter-play",
            statA: `${flexCountA} Flex Heroes`,
            statB: `${flexCountB} Flex Heroes`,
            winner: flexCountA > flexCountB ? 'A' : (flexCountB > flexCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Power Curve",
            desc: "Game pacing from early objective pressure to late scaling",
            statA: `${curveA.early}E / ${curveA.mid}M / ${curveA.late}L`,
            statB: `${curveB.early}E / ${curveB.mid}M / ${curveB.late}L`,
            winner: curveScoreA > curveScoreB ? 'A' : (curveScoreB > curveScoreA ? 'B' : 'EQUAL')
        },
        {
            name: "Ban Efficiency",
            desc: "Priority threats eliminated during ban turns",
            statA: `${banEffA.toFixed(0)}% Threat Ban`,
            statB: `${banEffB.toFixed(0)}% Threat Ban`,
            winner: banEffA > banEffB + 2 ? 'A' : (banEffB > banEffA + 2 ? 'B' : 'EQUAL')
        }
    ];

    return { scoreA, scoreB, categories };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        evaluateDraftComparison, 
        evaluateTeamDraft, 
        DRAFT_SEQUENCE, 
        getRecommendations, 
        getTeamOpenLanes, 
        COUNTER_DATA,
        getHeroCounters 
    };
}
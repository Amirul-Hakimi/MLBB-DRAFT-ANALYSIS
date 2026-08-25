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

// Counter Relationship Dataset (Sorted Alphabetically A-Z)
const COUNTER_DATA = {
  "Aamon": { "counteredBy": ["Cici", "Claude", "Hilda", "Marcel", "Zilong"] },
  "Akai": { "counteredBy": ["Alucard", "Fredrinn", "Nana", "Saber", "Silvanna"] },
  "Aldous": { "counteredBy": ["Belerick", "Helcurt", "Sun", "Uranus", "X.Borg"] },
  "Alice": { "counteredBy": ["Atlas", "Chip", "Gloo", "Tigreal", "Zhask"] },
  "Alpha": { "counteredBy": ["Barats", "Baxia", "Hilda", "Johnson", "Phoveus"] },
  "Alucard": { "counteredBy": ["Cyclops", "Helcurt", "Mathilda", "Natalia", "Sun"] },
  "Angela": { "counteredBy": ["Alice", "Balmond", "Faramis", "Lancelot", "Marcel"] },
  "Argus": { "counteredBy": ["Dyrroth", "Helcurt", "Karrie", "Masha", "Saber"] },
  "Arlott": { "counteredBy": ["Cici", "Khufra", "Natan", "X.Borg", "Zhuxin"] },
  "Atlas": { "counteredBy": ["Aamon", "Eudora", "Layla", "Lolita", "Popol and Kupa"] },
  "Aulus": { "counteredBy": ["Gloo", "Minsitthar", "Natalia", "Saber", "Sun"] },
  "Aurora": { "counteredBy": ["Chip", "Estes", "Eudora", "Lolita", "Odette"] },
  "Badang": { "counteredBy": ["Aldous", "Fanny", "Hayabusa", "Sun", "Zilong"] },
  "Balmond": { "counteredBy": ["Barats", "Johnson", "Lukas", "Phoveus", "Saber"] },
  "Bane": { "counteredBy": ["Baxia", "Faramis", "Khufra", "Odette", "Phoveus"] },
  "Barats": { "counteredBy": ["Alucard", "Argus", "Brody", "Phoveus", "Silvanna"] },
  "Baxia": { "counteredBy": ["Alice", "Claude", "Floryn", "Lukas", "Obsidia"] },
  "Beatrix": { "counteredBy": ["Baxia", "Diggie", "Edith", "Estes", "Hanabi"] },
  "Belerick": { "counteredBy": ["Kimmy", "Obsidia", "Saber", "Silvanna", "Zhask"] },
  "Benedetta": { "counteredBy": ["Alpha", "Atlas", "Natan", "Silvanna", "X.Borg"] },
  "Brody": { "counteredBy": ["Fanny", "Irithel", "Joy", "Karina", "Natalia"] },
  "Bruno": { "counteredBy": ["Benedetta", "Fanny", "Harith", "Marcel", "Wanwan"] },
  "Carmilla": { "counteredBy": ["Chip", "Estes", "Gloo", "Minotaur", "Popol and Kupa"] },
  "Cecilion": { "counteredBy": ["Barats", "Baxia", "Hanabi", "Lolita", "Phoveus"] },
  "Chang'e": { "counteredBy": ["Diggie", "Lancelot", "Lukas", "Masha", "X.Borg"] },
  "Chip": { "counteredBy": ["Hanzo", "Helcurt", "Lolita", "Paquito", "Valentina"] },
  "Chou": { "counteredBy": ["Beatrix", "Benedetta", "Fanny", "X.Borg", "Yve"] },
  "Cici": { "counteredBy": ["Alice", "Balmond", "Fredrinn", "Hylos", "Thamuz"] },
  "Claude": { "counteredBy": ["Chang'e", "Granger", "Ixia", "Lolita", "Yu Zhong"] },
  "Clint": { "counteredBy": ["Belerick", "Karina", "Lolita", "Lunox", "Melissa"] },
  "Cyclops": { "counteredBy": ["Aldous", "Ling", "Marcel", "Natalia", "Wanwan"] },
  "Diggie": { "counteredBy": ["Alpha", "Balmond", "Hylos", "Saber", "Zilong"] },
  "Dyrroth": { "counteredBy": ["Aldous", "Alice", "Esmeralda", "Natalia", "Uranus"] },
  "Edith": { "counteredBy": ["Alice", "Claude", "Freya", "Harith", "Silvanna"] },
  "Esmeralda": { "counteredBy": ["Diggie", "Lolita", "Marcel", "Mathilda", "Paquito"] },
  "Estes": { "counteredBy": ["Alice", "Cici", "Cyclops", "Faramis", "Masha"] },
  "Eudora": { "counteredBy": ["Floryn", "Irithel", "Marcel", "Rafaela", "Zilong"] },
  "Fanny": { "counteredBy": ["Clint", "Gloo", "Granger", "Kimmy", "Yve"] },
  "Faramis": { "counteredBy": ["Chip", "Gloo", "Obsidia", "Sun", "Wanwan"] },
  "Floryn": { "counteredBy": ["Alice", "Faramis", "Ling", "Marcel", "X.Borg"] },
  "Franco": { "counteredBy": ["Angela", "Benedetta", "Fanny", "Floryn", "Freya"] },
  "Fredrinn": { "counteredBy": ["Alucard", "Argus", "Esmeralda", "Gloo", "Odette"] },
  "Freya": { "counteredBy": ["Aulus", "Hanzo", "Lolita", "Sun", "Yve"] },
  "Gatotkaca": { "counteredBy": ["Atlas", "Chip", "Hanabi", "Miya", "Odette"] },
  "Gloo": { "counteredBy": ["Aamon", "Jawhead", "Johnson", "Karina", "Lesley"] },
  "Gord": { "counteredBy": ["Barats", "Fredrinn", "Lolita", "Phoveus", "Terizla"] },
  "Granger": { "counteredBy": ["Baxia", "Beatrix", "Diggie", "Karina", "Melissa"] },
  "Grock": { "counteredBy": ["Baxia", "Lolita", "Odette", "Popol and Kupa", "Yin"] },
  "Guinevere": { "counteredBy": ["Cici", "Esmeralda", "Julian", "Lunox", "Thamuz"] },
  "Gusion": { "counteredBy": ["Aamon", "Gord", "Natalia", "Suyou", "Valir"] },
  "Hanabi": { "counteredBy": ["Chip", "Kaja", "Moskov", "Popol and Kupa", "Saber"] },
  "Hanzo": { "counteredBy": ["Diggie", "Franco", "Khufra", "Layla", "Saber"] },
  "Harith": { "counteredBy": ["Irithel", "Johnson", "Lolita", "Suyou", "Zetian"] },
  "Harley": { "counteredBy": ["Alice", "Joy", "Melissa", "Suyou", "Valir"] },
  "Hayabusa": { "counteredBy": ["Aamon", "Karina", "Nolan", "Yve", "Zhuxin"] },
  "Helcurt": { "counteredBy": ["Gord", "Kimmy", "Valir", "X.Borg", "Xavier"] },
  "Hilda": { "counteredBy": ["Granger", "Harley", "Helcurt", "Nolan", "Novaria"] },
  "Hirara": { "counteredBy": ["Baxia", "Hanzo", "Joy", "X.Borg", "Yin"] },
  "Hylos": { "counteredBy": ["Johnson", "Khufra", "Layla", "Lukas", "Saber"] },
  "Irithel": { "counteredBy": ["Beatrix", "Benedetta", "Minsitthar", "Wanwan", "Yin"] },
  "Ixia": { "counteredBy": ["Cyclops", "Estes", "Floryn", "Lolita", "Rafaela"] },
  "Jawhead": { "counteredBy": ["Arlott", "Dyrroth", "Helcurt", "Nolan", "Zilong"] },
  "Johnson": { "counteredBy": ["Floryn", "Franco", "Layla", "Valentina", "Zilong"] },
  "Joy": { "counteredBy": ["Hanabi", "Lolita", "Sun", "Uranus", "X.Borg"] },
  "Julian": { "counteredBy": ["Alice", "Diggie", "Esmeralda", "Faramis", "Phoveus"] },
  "Kadita": { "counteredBy": ["Ixia", "Johnson", "Lolita", "Odette", "Silvanna"] },
  "Kagura": { "counteredBy": ["Lolita", "Silvanna", "Sun", "Vale", "X.Borg"] },
  "Kaja": { "counteredBy": ["Baxia", "Beatrix", "Kagura", "Valir", "Wanwan"] },
  "Kalea": { "counteredBy": ["Aldous", "Alucard", "Fanny", "Helcurt", "Zilong"] },
  "Karina": { "counteredBy": ["Helcurt", "Kimmy", "Lolita", "Marcel", "Natalia"] },
  "Karrie": { "counteredBy": ["Alice", "Aulus", "Balmond", "Leomord", "Terizla"] },
  "Khaleed": { "counteredBy": ["Harley", "Nolan", "Vale", "Yin", "Zilong"] },
  "Khufra": { "counteredBy": ["Alucard", "Beatrix", "Silvanna", "Wanwan", "Yin"] },
  "Kimmy": { "counteredBy": ["Alpha", "Balmond", "Hanzo", "Hylos", "Sun"] },
  "Lancelot": { "counteredBy": ["Alpha", "Atlas", "Baxia", "X.Borg", "Yin"] },
  "Lapu-Lapu": { "counteredBy": ["Argus", "Masha", "Phoveus", "Popol and Kupa", "Silvanna"] },
  "Layla": { "counteredBy": ["Edith", "Faramis", "Melissa", "Phoveus", "Rafaela"] },
  "Leomord": { "counteredBy": ["Belerick", "Lolita", "Natalia", "Popol and Kupa", "Saber"] },
  "Lesley": { "counteredBy": ["Belerick", "Bruno", "Claude", "Gatotkaca", "Marcel"] },
  "Ling": { "counteredBy": ["Atlas", "Gloo", "Hanzo", "Valir", "X.Borg"] },
  "Lolita": { "counteredBy": ["Chang'e", "Cyclops", "Edith", "Floryn", "Harley"] },
  "Lukas": { "counteredBy": ["Arlott", "Fanny", "Ling", "Natalia", "Zilong"] },
  "Lunox": { "counteredBy": ["Esmeralda", "Gloo", "Karina", "Natalia", "Wanwan"] },
  "Luo Yi": { "counteredBy": ["Baxia", "Estes", "Faramis", "Popol and Kupa", "Uranus"] },
  "Lylia": { "counteredBy": ["Alpha", "Baxia", "Diggie", "Hanabi", "Johnson"] },
  "Marcel": { "counteredBy": ["Atlas", "Chip", "Kadita", "Khufra", "Martis"] },
  "Martis": { "counteredBy": ["Alucard", "Chip", "Dyrroth", "Johnson", "Saber"] },
  "Masha": { "counteredBy": ["Dyrroth", "Fanny", "Guinevere", "Wanwan", "Yu Zhong"] },
  "Mathilda": { "counteredBy": ["Benedetta", "Granger", "Natalia", "Valir", "X.Borg"] },
  "Melissa": { "counteredBy": ["Alucard", "Faramis", "Leomord", "Lolita", "Mathilda"] },
  "Minotaur": { "counteredBy": ["Cyclops", "Khufra", "Lolita", "Odette", "Silvanna"] },
  "Minsitthar": { "counteredBy": ["Freya", "Harith", "Lukas", "Martis", "Phoveus"] },
  "Miya": { "counteredBy": ["Irithel", "Obsidia", "Saber", "Selena", "Silvanna"] },
  "Moskov": { "counteredBy": ["Beatrix", "Fanny", "Gloo", "Joy", "Wanwan"] },
  "Nana": { "counteredBy": ["Alucard", "Edith", "Estes", "Lolita", "Odette"] },
  "Natalia": { "counteredBy": ["Ling", "Lolita", "Minsitthar", "Nolan", "Xavier"] },
  "Natan": { "counteredBy": ["Esmeralda", "Gloo", "Sun", "Uranus", "Zhask"] },
  "Nolan": { "counteredBy": ["Bane", "Estes", "Floryn", "Valir", "X.Borg"] },
  "Novaria": { "counteredBy": ["Bane", "Diggie", "Kaja", "Marcel", "Valir"] },
  "Obsidia": { "counteredBy": ["Beatrix", "Benedetta", "Fanny", "Helcurt", "Nolan"] },
  "Odette": { "counteredBy": ["Hirara", "Kaja", "Marcel", "Mathilda", "Rafaela"] },
  "Paquito": { "counteredBy": ["Aldous", "Karina", "Natalia", "Wanwan", "X.Borg"] },
  "Pharsa": { "counteredBy": ["Hanabi", "Lolita", "Melissa", "Valir", "Yve"] },
  "Phoveus": { "counteredBy": ["Alucard", "Freya", "Harith", "Ruby", "Wanwan"] },
  "Popol and Kupa": { "counteredBy": ["Diggie", "Harith", "Harley", "Mathilda", "Zilong"] },
  "Rafaela": { "counteredBy": ["Alice", "Karrie", "Marcel", "Natalia", "Valir"] },
  "Roger": { "counteredBy": ["Aldous", "Gusion", "Harley", "Masha", "Yin"] },
  "Ruby": { "counteredBy": ["Gloo", "Joy", "Lunox", "Masha", "Sun"] },
  "Saber": { "counteredBy": ["Hirara", "Ling", "Lunox", "Natalia", "Nolan"] },
  "Selena": { "counteredBy": ["Beatrix", "Benedetta", "Ixia", "X.Borg", "Yve"] },
  "Silvanna": { "counteredBy": ["Aamon", "Aldous", "Angela", "Floryn", "Rafaela"] },
  "Sora": { "counteredBy": ["Estes", "Karina", "Natan", "Popol and Kupa", "Rafaela"] },
  "Sun": { "counteredBy": ["Cici", "Diggie", "Jawhead", "Lesley", "Masha"] },
  "Suyou": { "counteredBy": ["Balmond", "Baxia", "Diggie", "Natalia", "Sun"] },
  "Terizla": { "counteredBy": ["Argus", "Masha", "Phoveus", "Popol and Kupa", "Tigreal"] },
  "Thamuz": { "counteredBy": ["Alice", "Alucard", "Dyrroth", "Lukas", "Masha"] },
  "Tigreal": { "counteredBy": ["Estes", "Franco", "Lesley", "Lolita", "Zilong"] },
  "Uranus": { "counteredBy": ["Argus", "Barats", "Masha", "Phoveus", "Yi Sun-shin"] },
  "Valentina": { "counteredBy": ["Atlas", "Carmilla", "Grock", "Lolita", "X.Borg"] },
  "Vale": { "counteredBy": ["Estes", "Melissa", "Odette", "Rafaela", "Silvanna"] },
  "Valir": { "counteredBy": ["Alice", "Balmond", "Fredrinn", "Leomord", "Thamuz"] },
  "Vexana": { "counteredBy": ["Alucard", "Chip", "Gloo", "Odette", "Zhask"] },
  "Wanwan": { "counteredBy": ["Alpha", "Atlas", "Ixia", "Thamuz", "Yin"] },
  "X.Borg": { "counteredBy": ["Barats", "Baxia", "Martis", "Phoveus", "Terizla"] },
  "Xavier": { "counteredBy": ["Baxia", "Belerick", "Hylos", "Terizla", "Uranus"] },
  "Yi Sun-shin": { "counteredBy": ["Benedetta", "Diggie", "Khufra", "Melissa", "Wanwan"] },
  "Yin": { "counteredBy": ["Diggie", "Floryn", "Minsitthar", "Phoveus", "Silvanna"] },
  "Yu Zhong": { "counteredBy": ["Atlas", "Carmilla", "Gloo", "Minsitthar", "Popol and Kupa"] },
  "Yve": { "counteredBy": ["Alpha", "Balmond", "Lolita", "Minotaur", "X.Borg"] },
  "Zetian": { "counteredBy": ["Helcurt", "Lolita", "Natalia", "Popol and Kupa", "Tigreal"] },
  "Zhask": { "counteredBy": ["Arlott", "Chip", "Diggie", "Kaja", "Lolita"] },
  "Zhuxin": { "counteredBy": ["Aamon", "Hanzo", "Hylos", "Khufra", "Lolita"] },
  "Zilong": { "counteredBy": ["Angela", "Benedetta", "Cici", "Novaria", "X.Borg"] }
};

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
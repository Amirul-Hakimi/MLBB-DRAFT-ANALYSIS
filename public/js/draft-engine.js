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

function getCurrentTurn() {
    if (!draftState || draftState.currentTurnIndex >= DRAFT_SEQUENCE.length) return null;
    return DRAFT_SEQUENCE[draftState.currentTurnIndex];
}

// FIXED: Use .some() so only actually picked or banned heroes are marked unavailable
function isHeroUnavailable(heroId) {
    if (!draftState) return false;
    const isBanned = [...(draftState.bans?.A || []), ...(draftState.bans?.B || [])].some(h => h.id === heroId);
    const isPicked = [...(draftState.picks?.A || []), ...(draftState.picks?.B || [])].some(h => h.id === heroId);
    return isBanned || isPicked;
}

function getRecommendations() {
    const turn = getCurrentTurn();
    if (!turn) return { type: 'complete', list: [], neededLanes: [] };

    const availableHeroes = HERO_DATASET.filter(h => !isHeroUnavailable(h.id));

    if (turn.action === 'ban') {
        const sorted = [...availableHeroes].sort((a, b) => (b.banRate || 0) - (a.banRate || 0));
        return {
            type: 'ban',
            list: sorted.slice(0, 6),
            neededLanes: []
        };
    }

    const myPicks = draftState.picks[turn.team] || [];
    const coveredLanes = new Set();
    myPicks.forEach(hero => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        lanes.forEach(l => coveredLanes.add(l));
    });

    const neededLanes = ALL_LANES.filter(l => !coveredLanes.has(l));

    let candidates = availableHeroes;
    if (neededLanes.length > 0) {
        const filtered = availableHeroes.filter(hero => {
            const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
            return lanes.some(l => neededLanes.includes(l));
        });
        if (filtered.length > 0) {
            candidates = filtered;
        }
    }

    const sorted = [...candidates].sort((a, b) => {
        const rateA = (typeof getHeroPickRate === 'function') ? getHeroPickRate(a) : 0;
        const rateB = (typeof getHeroPickRate === 'function') ? getHeroPickRate(b) : 0;
        return rateB - rateA;
    });

    return {
        type: 'pick',
        list: sorted.slice(0, 6),
        neededLanes: neededLanes
    };
}

function evaluateTeamDraft(picks) {
    if (!picks || picks.length === 0) {
        return { score: 0, breakdown: [{ text: "No heroes selected", type: "neg" }], coveredLanes: [] };
    }

    const breakdown = [];
    let score = 0;

    // 1. Meta Strength
    const avgWinRate = picks.reduce((sum, h) => sum + (h.winRate || 50), 0) / picks.length;
    const metaPts = Math.min(30, Math.round((avgWinRate - 45) * 4));
    score += metaPts;
    breakdown.push({ text: `Meta Win-Rate Rating: +${metaPts} pts (avg ${avgWinRate.toFixed(1)}%)`, type: "pos" });

    // 2. Lane Coverage
    const coveredLanes = new Set();
    picks.forEach(h => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(h) : (hero.lanes || []);
        lanes.forEach(l => coveredLanes.add(l));
    });
    const coveragePts = coveredLanes.size * 8;
    score += coveragePts;
    breakdown.push({ text: `Lane Coverage: +${coveragePts} pts (${coveredLanes.size}/5 unique roles)`, type: "pos" });

    // 3. Full 5-Role Bonus
    if (coveredLanes.size >= 5) {
        score += 20;
        breakdown.push({ text: "Full 5-Role Balanced Lineup Bonus: +20 pts", type: "pos" });
    } else {
        const missing = ALL_LANES.filter(l => !coveredLanes.has(l));
        score -= 15;
        breakdown.push({ text: `Missing Required Roles (${missing.join(', ')}): -15 pts`, type: "neg" });
    }

    // 4. Power Spike Curve
    const spikes = picks.map(h => h.powerSpike || "Mid");
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
        coveredLanes: Array.from(coveredLanes)
    };
}
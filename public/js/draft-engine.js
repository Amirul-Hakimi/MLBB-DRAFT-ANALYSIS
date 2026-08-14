// --- MLBB DRAFT ENGINE CORE LOGIC ---

// Fixed 20-Step Draft Sequence
const DRAFT_SEQUENCE = [
    // Ban Phase 1 (6 actions: A, B, A, B, A, B)
    { turn: 1,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 2,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 3,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 4,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 5,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 6,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },

    // Pick Phase 1 (6 actions: A, B, B, A, A, B)
    { turn: 7,  phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 8,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 9,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 10, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 11, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 12, phase: 'Pick Phase 1', action: 'pick', team: 'B' },

    // Ban Phase 2 (4 actions: B, A, B, A)
    { turn: 13, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 14, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },
    { turn: 15, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 16, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },

    // Pick Phase 2 (4 actions: B, A, A, B)
    { turn: 17, phase: 'Pick Phase 2', action: 'pick', team: 'B' },
    { turn: 18, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 19, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 20, phase: 'Pick Phase 2', action: 'pick', team: 'B' }
];


// Central Draft Engine State
let draftState = {};

// 1. Initialize / Reset the Draft Engine
function resetDraft() {
    draftState = {
        currentTurnIndex: 0,
        isComplete: false,
        bans: { A: [], B: [] },
        picks: { A: [], B: [] },
        draftLog: []
    };
    console.log("Draft reset. Turn 1 ready.");
}

// 2. Helper: Check if a hero is already banned or picked
// Helper: Check if a hero is already banned or picked
function isHeroUnavailable(heroId) {
    const allBannedIds = [...draftState.bans.A, ...draftState.bans.B].map(hero => hero.id);
    const allPickedIds = [...draftState.picks.A, ...draftState.picks.B].map(hero => hero.id);
    
    return allBannedIds.includes(heroId) || allPickedIds.includes(heroId);
}

// 3. Helper: Get Current Turn Details
function getCurrentTurn() {
    if (draftState.isComplete) return null;
    return DRAFT_SEQUENCE[draftState.currentTurnIndex];
}

// 4. Core Engine Function: Execute a Hero Selection Action
function executeAction(heroId) {
    // Check if draft is already finished
    if (draftState.isComplete) {
        return { success: false, message: "Draft is already complete!" };
    }

    // Verify hero existence in pool
    const hero = HERO_DATASET.find(h => h.id === heroId);
    if (!hero) {
        return { success: false, message: `Hero ID '${heroId}' not found in pool.` };
    }

    // Rule: Hero must not be already banned or picked
    if (isHeroUnavailable(heroId)) {
        return { success: false, message: `${hero.name} has already been banned or picked!` };
    }

    // Get active turn rules
    const currentTurn = getCurrentTurn();
    const team = currentTurn.team; // 'A' or 'B'
    const action = currentTurn.action; // 'ban' or 'pick'

    // Execute the action in state
    if (action === 'ban') {
        draftState.bans[team].push(hero);
    } else {
        draftState.picks[team].push(hero);
    }

    // Log action details
    const logEntry = {
        turn: currentTurn.turn,
        phase: currentTurn.phase,
        team: team,
        action: action,
        hero: hero.name
    };
    draftState.draftLog.push(logEntry);

    // Advance turn index
    draftState.currentTurnIndex++;

    // Check if draft sequence completed (after turn 20)
    if (draftState.currentTurnIndex >= DRAFT_SEQUENCE.length) {
        draftState.isComplete = true;
    }

    return {
        success: true,
        logEntry: logEntry,
        isComplete: draftState.isComplete,
        nextTurn: getCurrentTurn()
    };
}

// Initialize on script load
resetDraft();

// At the bottom of draft-engine.js
window.resetDraft = resetDraft;
window.executeAction = executeAction;

// --- RULE-BASED RECOMMENDATION ENGINE ---
const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];

function getRecommendations() {
    if (draftState.isComplete) return { type: 'complete', list: [], neededLanes: [] };

    const turn = getCurrentTurn();
    const availableHeroes = HERO_DATASET.filter(hero => !isHeroUnavailable(hero.id));

    // 1. BAN TURN RECOMMENDATIONS
    if (turn.action === 'ban') {
        const sorted = [...availableHeroes].sort((a, b) => b.banWeight - a.banWeight);
        return {
            type: 'ban',
            neededLanes: [],
            list: sorted.slice(0, 6)
        };
    }

    // 2. PICK TURN RECOMMENDATIONS
    const teamPicks = draftState.picks[turn.team];
    
    // Collect filled lanes from team's current picks
    const filledLanes = new Set();
    teamPicks.forEach(hero => {
        hero.lanes.forEach(lane => filledLanes.add(lane));
    });

    // Find missing lanes
    const neededLanes = ALL_LANES.filter(lane => !filledLanes.has(lane));

    // Filter available heroes that fill at least one missing lane
    let laneFitHeroes = availableHeroes.filter(hero => 
        hero.lanes.some(lane => neededLanes.includes(lane))
    );

    // Fallback if all lanes filled or no direct matches
    if (laneFitHeroes.length === 0) {
        laneFitHeroes = availableHeroes;
    }

    // Sort by pickWeight
    const sorted = [...laneFitHeroes].sort((a, b) => b.pickWeight - a.pickWeight);

    return {
        type: 'pick',
        neededLanes: neededLanes,
        list: sorted.slice(0, 6)
    };
}

// Expose helper globally
window.getRecommendations = getRecommendations;
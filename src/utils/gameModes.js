export const GAME_MODES = {
    knockout: {
        name: 'Knockout',
        description: 'Knock enemies off to score. First to 3 KOs wins.',
        stocksPerPlayer: 3,
        timeLimit: 180,
        winCondition: 'stocks',
        damageDecay: false,
        scoreToWin: 3
    },
    survival: {
        name: 'Survival',
        description: 'Last puck standing wins!',
        stocksPerPlayer: 1,
        timeLimit: 0,
        winCondition: 'lastStanding',
        damageDecay: false
    },
    timed: {
        name: 'Timed Match',
        description: 'Most KOs when time runs out wins.',
        stocksPerPlayer: Infinity,
        timeLimit: 120,
        winCondition: 'score',
        damageDecay: true
    },
    chaos: {
        name: 'Chaos Mode',
        description: 'Maximum powerups, maximum mayhem!',
        stocksPerPlayer: 5,
        timeLimit: 180,
        winCondition: 'stocks',
        damageDecay: false,
        powerupSpawnRate: 0.5
    }
};

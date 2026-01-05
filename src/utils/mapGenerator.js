/**
 * Procedural Map Generator
 * Generates unique, balanced arenas from a numeric seed.
 */

// Tile types
export const TILE_TYPES = {
    FLOOR: 'floor',
    ICE: 'ice',
    LAVA: 'lava',
    RAMP: 'ramp',
    BUMPER: 'bumper',
    WALL: 'wall',
    SPAWN: 'spawn',
    POWERUP_ZONE: 'powerup'
};

// Biome definitions
export const BIOMES = {
    ICE_REALM: {
        name: 'Ice Realm',
        primary: TILE_TYPES.ICE,
        hazard: TILE_TYPES.LAVA,
        colors: { floor: '#1a2a3a', accent: '#00d4ff', hazard: '#ff4500' },
        weights: { floor: 0.4, ice: 0.35, lava: 0.05, ramp: 0.1, bumper: 0.1 }
    },
    VOLCANO: {
        name: 'Volcano',
        primary: TILE_TYPES.FLOOR,
        hazard: TILE_TYPES.LAVA,
        colors: { floor: '#2a1a1a', accent: '#ff6b00', hazard: '#ff0000' },
        weights: { floor: 0.5, ice: 0.05, lava: 0.2, ramp: 0.15, bumper: 0.1 }
    },
    NEON_CITY: {
        name: 'Neon City',
        primary: TILE_TYPES.FLOOR,
        hazard: TILE_TYPES.WALL,
        colors: { floor: '#0a0a1a', accent: '#ff00ff', hazard: '#00ff87' },
        weights: { floor: 0.5, ice: 0.1, lava: 0.05, ramp: 0.15, bumper: 0.2 }
    },
    CHAOS: {
        name: 'Chaos Arena',
        primary: TILE_TYPES.FLOOR,
        hazard: TILE_TYPES.LAVA,
        colors: { floor: '#1a1a2a', accent: '#ffff00', hazard: '#ff0000' },
        weights: { floor: 0.3, ice: 0.15, lava: 0.15, ramp: 0.2, bumper: 0.2 }
    }
};

// Seeded random number generator (Mulberry32)
function createRNG(seed) {
    let state = seed;
    return function () {
        state |= 0;
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Generate a map from a seed
export function generateMap(seed, gridSize = 10, chaosLevel = 0.5) {
    const rng = createRNG(seed);

    // Determine biome from seed
    const biomeKeys = Object.keys(BIOMES);
    const biome = BIOMES[biomeKeys[Math.floor(rng() * biomeKeys.length)]];

    // Initialize grid
    const grid = [];
    for (let z = 0; z < gridSize; z++) {
        const row = [];
        for (let x = 0; x < gridSize; x++) {
            row.push({ type: TILE_TYPES.FLOOR, x, z });
        }
        grid.push(row);
    }

    // Place spawn points (corners, mirrored for fairness)
    const spawns = [
        { x: 1, z: 1 },
        { x: gridSize - 2, z: gridSize - 2 },
        { x: 1, z: gridSize - 2 },
        { x: gridSize - 2, z: 1 }
    ];
    spawns.forEach(s => {
        grid[s.z][s.x].type = TILE_TYPES.SPAWN;
    });

    // Place powerup zones (center and mid-points)
    const powerupZones = [
        { x: Math.floor(gridSize / 2), z: Math.floor(gridSize / 2) },
        { x: 2, z: Math.floor(gridSize / 2) },
        { x: gridSize - 3, z: Math.floor(gridSize / 2) }
    ];
    powerupZones.forEach(p => {
        if (grid[p.z] && grid[p.z][p.x]) {
            grid[p.z][p.x].type = TILE_TYPES.POWERUP_ZONE;
        }
    });

    // Fill remaining tiles based on biome weights and chaos level
    for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
            const tile = grid[z][x];
            if (tile.type !== TILE_TYPES.FLOOR) continue;

            // Edge protection: walls on boundary
            if (x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1) {
                tile.type = TILE_TYPES.WALL;
                continue;
            }

            const roll = rng();
            const adjustedWeights = { ...biome.weights };

            // Chaos level increases hazard frequency
            adjustedWeights.lava *= (1 + chaosLevel);
            adjustedWeights.bumper *= (1 + chaosLevel * 0.5);

            // Normalize weights
            const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
            let cumulative = 0;

            for (const [tileType, weight] of Object.entries(adjustedWeights)) {
                cumulative += weight / total;
                if (roll < cumulative) {
                    tile.type = tileType === 'floor' ? TILE_TYPES.FLOOR :
                        tileType === 'ice' ? TILE_TYPES.ICE :
                            tileType === 'lava' ? TILE_TYPES.LAVA :
                                tileType === 'ramp' ? TILE_TYPES.RAMP :
                                    TILE_TYPES.BUMPER;
                    break;
                }
            }
        }
    }

    // Symmetry pass for 1v1/2v2 balance
    for (let z = 0; z < Math.floor(gridSize / 2); z++) {
        for (let x = 0; x < gridSize; x++) {
            const mirrorZ = gridSize - 1 - z;
            const mirrorX = gridSize - 1 - x;

            // Mirror diagonally for point symmetry
            if (grid[mirrorZ] && grid[mirrorZ][mirrorX]) {
                const originalType = grid[z][x].type;
                if (originalType !== TILE_TYPES.SPAWN && originalType !== TILE_TYPES.POWERUP_ZONE) {
                    grid[mirrorZ][mirrorX].type = originalType;
                }
            }
        }
    }

    return {
        seed,
        gridSize,
        biome,
        grid,
        spawns,
        powerupZones
    };
}

// Convert grid to 3D world positions
export function gridToWorld(gridX, gridZ, gridSize, tileSize = 3) {
    const offset = (gridSize * tileSize) / 2;
    return {
        x: gridX * tileSize - offset + tileSize / 2,
        z: gridZ * tileSize - offset + tileSize / 2
    };
}

// Get spawn positions in world coordinates
export function getSpawnPositions(mapData, tileSize = 3) {
    return mapData.spawns.map(s => {
        const { x, z } = gridToWorld(s.x, s.z, mapData.gridSize, tileSize);
        return [x, 0.5, z];
    });
}

// Validate map connectivity (ensure all spawn points can reach each other)
export function validateMap(mapData) {
    const { grid, gridSize, spawns } = mapData;

    // Simple flood fill from first spawn
    const visited = new Set();
    const queue = [spawns[0]];

    while (queue.length > 0) {
        const { x, z } = queue.shift();
        const key = `${x},${z}`;

        if (visited.has(key)) continue;
        if (x < 0 || x >= gridSize || z < 0 || z >= gridSize) continue;

        const tile = grid[z][x];
        if (tile.type === TILE_TYPES.WALL || tile.type === TILE_TYPES.LAVA) continue;

        visited.add(key);

        queue.push({ x: x + 1, z });
        queue.push({ x: x - 1, z });
        queue.push({ x, z: z + 1 });
        queue.push({ x, z: z - 1 });
    }

    // Check all spawns are reachable
    return spawns.every(s => visited.has(`${s.x},${s.z}`));
}

// Generate a valid map (retry if invalid)
export function generateValidMap(baseSeed, gridSize = 10, chaosLevel = 0.5, maxAttempts = 10) {
    let seed = baseSeed;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const map = generateMap(seed, gridSize, chaosLevel);
        if (validateMap(map)) {
            return map;
        }
        seed = (seed * 1103515245 + 12345) & 0x7fffffff; // LCG for next seed
    }

    // Fallback: generate a simple floor map
    console.warn('Failed to generate valid map, using fallback');
    return generateMap(baseSeed, gridSize, 0);
}

import React from 'react';

// Registry of all 20+ Powerups
export const POWERUP_REGISTRY = {
    // --- OFFENSIVE (Projeciles & Traps) ---
    ROCKET: {
        id: 'rocket',
        name: 'Homing Rocket',
        type: 'projectile',
        icon: '🚀',
        imagePath: '/images/powerups/rocket.png',
        color: '#ff4500',
        desc: 'Fires a homing missile at nearest enemy',
        cooldown: 5000
    },
    GLUE_GUN: {
        id: 'glue_gun',
        name: 'Glue Shot',
        type: 'projectile',
        icon: '🧴',
        imagePath: '/images/powerups/glue_gun.png',
        color: '#ffff00',
        desc: 'Shoots a blob that slows enemy by 80%',
        cooldown: 3000
    },
    WEB_DROP: {
        id: 'web_drop',
        name: 'Spider Web',
        type: 'trap',
        icon: '🕸️',
        imagePath: '/images/powerups/web_drop.png',
        color: '#ffffff',
        desc: 'Drops a sticky web behind you',
        cooldown: 8000
    },
    SAW_BLADE: {
        id: 'saw_blade',
        name: 'Rolling Saw',
        type: 'projectile',
        icon: '⚙️',
        imagePath: '/images/powerups/saw_blade.png',
        color: '#808080',
        desc: 'Launches a physics-based saw blade',
        cooldown: 4000
    },
    BOMB_THROW: {
        id: 'bomb_throw',
        name: 'Cherry Bomb',
        type: 'projectile',
        icon: '💣',
        imagePath: '/images/powerups/bomb_throw.png',
        color: '#000000',
        desc: 'Throws a bomb that explodes in 2s',
        cooldown: 6000
    },
    FREEZE_RAY: {
        id: 'freeze_ray',
        name: 'Freeze Ray',
        type: 'beam',
        icon: '❄️',
        imagePath: '/images/powerups/freeze_ray.png',
        color: '#00ffff',
        desc: 'Freezes enemy in place for 2s',
        cooldown: 10000
    },

    // --- DEFENSIVE ---
    SHIELD: {
        id: 'shield',
        name: 'Bubble Shield',
        type: 'buff',
        icon: '🛡️',
        imagePath: '/images/powerups/shield.png',
        color: '#0000ff',
        desc: 'Blocks next hit + Immune to traps',
        duration: 8000
    },
    SPIKE_ARMOR: {
        id: 'spike_armor',
        name: 'Spike Vest',
        type: 'buff',
        icon: '🐡',
        imagePath: '/images/powerups/spike_armor.png',
        color: '#555555',
        desc: 'Deals damage back to attackers',
        duration: 10000
    },
    GHOST: {
        id: 'ghost',
        name: 'Phase Shift',
        type: 'buff',
        icon: '👻',
        imagePath: '/images/powerups/ghost.png',
        color: '#ffffff',
        desc: 'Pass through objects and players',
        duration: 5000
    },
    SHRINK: {
        id: 'shrink',
        name: 'Mini Me',
        type: 'buff',
        icon: '🐜',
        imagePath: '/images/powerups/shrink.png',
        color: '#ffcc00',
        desc: 'Smaller size, harder to hit, faster',
        duration: 15000
    },

    // --- MOBILITY ---
    SPEED_BOOST: {
        id: 'speed_boost',
        name: 'Nitro Boost',
        type: 'buff',
        icon: '⚡',
        imagePath: '/images/powerups/speed_boost.png',
        color: '#00ff00',
        desc: '2x Speed for 5 seconds',
        duration: 5000
    },
    JUMP_JET: {
        id: 'jump_jet',
        name: 'Jump Jets',
        type: 'action',
        icon: '⏫',
        imagePath: '/images/powerups/jump_jet.png',
        color: '#ff9900',
        desc: 'Press SPACE to fly over gaps',
        duration: 5000
    },
    TELEPORT: {
        id: 'teleport',
        name: 'Blink',
        type: 'action',
        icon: '🌌',
        imagePath: '/images/powerups/teleport.png',
        color: '#800080',
        desc: 'Teleport 10m forward instantly',
        cooldown: 5000
    },
    GRAPPLING_HOOK: {
        id: 'grapple',
        name: 'Grapple',
        type: 'action',
        icon: '🪝',
        imagePath: '/images/powerups/grapple.png',
        color: '#555555',
        desc: 'Pull yourself towards walls or enemies',
        cooldown: 4000
    },

    // --- CHAOS ---
    GIANT_MODE: {
        id: 'giant',
        name: 'Kaiju Mode',
        type: 'buff',
        icon: '🦖',
        imagePath: '/images/powerups/giant.png',
        color: '#ff0000',
        desc: 'Grow huge, crush items, immune to knockback',
        duration: 10000
    },
    INVISIBILITY: {
        id: 'invisible',
        name: 'Cloak',
        type: 'buff',
        icon: '🕵️',
        imagePath: '/images/powerups/invisible.png',
        color: '#111111',
        desc: 'Invisible to enemies (nameplate hidden)',
        duration: 8000
    },
    MAGNET: {
        id: 'magnet',
        name: 'Attractor',
        type: 'buff',
        icon: '🧲',
        imagePath: '/images/powerups/magnet.png',
        color: '#ff0000',
        desc: 'Pulls nearby powerups and enemies',
        duration: 10000
    },
    REVERSE_CONTROLS: {
        id: 'curse',
        name: 'Hex Hex',
        type: 'curse',
        icon: '😵',
        imagePath: '/images/powerups/curse.png',
        color: '#8800ff',
        desc: 'Reverses nearest enemy controls',
        cooldown: 15000
    },
    BLACK_HOLE: {
        id: 'black_hole',
        name: 'Singularity',
        type: 'projectile',
        icon: '⚫',
        imagePath: '/images/powerups/black_hole.png',
        color: '#000000',
        desc: 'Spawns a gravity well that sucks players in',
        cooldown: 20000
    },
    FART_BOMB: {
        id: 'fart',
        name: 'Toxic Cloud',
        type: 'trap',
        icon: '💨',
        imagePath: '/images/powerups/fart.png',
        color: '#00ff00',
        desc: 'Leaves a cloud that blinds enemies',
        cooldown: 8000
    }
};

export const DEFAULT_LOADOUT = ['speed_boost', 'rocket', 'shield'];

// Get info about a powerup ID
export function getPowerupInfo(id) {
    return POWERUP_REGISTRY[id.toUpperCase()] || POWERUP_REGISTRY.SPEED_BOOST;
}

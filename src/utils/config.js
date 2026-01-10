/**
 * Central Configuration
 * Single source of truth for environment variables and game constants
 */

// Server URL - Prioritize Environment Variable, fallback to Render URL or localhost
const SERVER_URL = process.env.REACT_APP_SERVER_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://puck-battle-arena-server.onrender.com' // Replace with your actual Render URL if known
        : 'http://localhost:3002');

export const CONFIG = {
    SERVER_URL,

    // Connection Settings
    CONNECTION: {
        RECONNECTION_ATTEMPTS: 5,
        RECONNECTION_DELAY: 1000,
        TIMEOUT: 10000
    },

    // Game Client Settings
    CLIENT: {
        VERSION: '0.9.0',
        MAX_NAME_LENGTH: 16,
        DEBUG_MODE: process.env.NODE_ENV !== 'production'
    },

    // Storage Keys for Persistence
    STORAGE_KEYS: {
        PLAYER_ID: 'pba_player_id',
        ROOM_CODE: 'pba_room_code',
        PLAYER_NAME: 'pba_player_name',
        PLAYER_COLOR: 'pba_player_color'
    }
};

export default CONFIG;

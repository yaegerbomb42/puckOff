import { io } from 'socket.io-client';
import { CONFIG } from '../utils/config';

// Shared socket instance for non-hook consumers (e.g., Lobby server stats)
export const socket = io(CONFIG.SERVER_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
});

// Auto-connect when imported
socket.connect();

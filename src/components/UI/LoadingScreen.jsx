import React from 'react';
import PuckPreview from './PuckPreview';

export default function LoadingScreen() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'black',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Reuse the high-quality Puck model */}
            <PuckPreview size={300} icon={{ tier: 1, color: '#00d4ff' }} />

            <div style={{
                color: '#00d4ff',
                fontFamily: 'Orbitron',
                marginTop: '1rem',
                letterSpacing: '4px',
                textShadow: '0 0 10px #00d4ff',
                animation: 'blink 1.5s infinite alternate'
            }}>
                LOADING
            </div>
            <style>{`
                @keyframes blink { from { opacity: 0.5; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}

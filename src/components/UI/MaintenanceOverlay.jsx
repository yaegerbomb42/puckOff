import React, { useEffect, useState } from 'react';

export default function MaintenanceOverlay({ message }) {
    const [timeLeft, setTimeLeft] = useState(message?.duration ? message.duration * 60 : 0);

    useEffect(() => {
        if (!message || !message.duration) return;

        // Reset timer when message changes
        setTimeLeft(message.duration * 60);

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [message]);

    if (!message) return null;

    // Formatting MM:SS
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const isCritical = timeLeft < 60; // Red alert last minute

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Allow clicking through
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: '5vh'
        }}>
            {/* Top Bar Banner */}
            <div style={{
                background: isCritical
                    ? 'rgba(255, 0, 0, 0.9)'
                    : 'linear-gradient(90deg, rgba(255,165,0,0) 0%, rgba(255,165,0,0.8) 20%, rgba(255,165,0,0.8) 80%, rgba(255,165,0,0) 100%)',
                color: '#fff',
                padding: '1rem 4rem',
                borderRadius: '0 0 20px 20px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(255, 165, 0, 0.4)',
                transform: 'translateY(0)',
                transition: 'all 0.5s ease',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderTop: 'none'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    ⚠️ SERVER UPDATE INBOUND
                </h2>
                <div style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    color: isCritical ? '#ffcccc' : '#fff'
                }}>
                    T-MINUS {timeString}
                </div>
                <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                    Server will restart for improvements. Please finish your match.
                </p>
            </div>

            {/* Screen border effect if critical */}
            {isCritical && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    boxShadow: 'inset 0 0 100px rgba(255, 0, 0, 0.5)',
                    animation: 'pulse 1s infinite alternate',
                    zIndex: -1
                }} />
            )}

            <style>{`
                @keyframes pulse {
                    from { opacity: 0.3; }
                    to { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}

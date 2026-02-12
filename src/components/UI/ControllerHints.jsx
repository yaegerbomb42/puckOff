import React, { useEffect, useState } from 'react';

const ControllerHints = ({ visible }) => {
    const [activeController, setActiveController] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const handleConnect = (e) => {
            console.log("🎮 Controller connected:", e.gamepad.id);
            setActiveController(true);
            setShowToast(true);
            // Hide toast after 3 seconds, but keep hints active
            setTimeout(() => setShowToast(false), 3000);
        };

        const handleDisconnect = () => {
            console.log("❌ Controller disconnected");
            setActiveController(false);
            setShowToast(false);
        };

        window.addEventListener('gamepadconnected', handleConnect);
        window.addEventListener('gamepaddisconnected', handleDisconnect);

        // Check initial state
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        if (gamepads[0]) {
            setActiveController(true);
            // Don't show toast on initial load, just show hints if needed
        }

        return () => {
            window.removeEventListener('gamepadconnected', handleConnect);
            window.removeEventListener('gamepaddisconnected', handleDisconnect);
        };
    }, []);

    if (!activeController && !visible) return null;

    // Toast Style (Centered & Large)
    const toastStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        background: 'rgba(0, 212, 255, 0.9)', // Primary Blue
        color: '#000',
        padding: '2rem 4rem',
        borderRadius: '20px',
        zIndex: 2000,
        textAlign: 'center',
        boxShadow: '0 0 50px rgba(0, 212, 255, 0.6)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        pointerEvents: 'none'
    };

    // Corner Hints Style (Bottom Right)
    const containerStyle = {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontFamily: "'Rajdhani', sans-serif",
        zIndex: 100,
        width: '280px',
        transition: 'all 0.5s ease',
        opacity: activeController || visible ? 1 : 0,
        transform: showToast ? 'translateY(100px)' : 'translateY(0)', // Hide when toast is shown
        pointerEvents: 'none',
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#00d4ff',
        fontFamily: "'Orbitron', sans-serif"
    };

    const rowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#ccc',
        fontWeight: '500'
    };

    // Xbox Button Styles
    const btnStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        fontWeight: 'bold',
        fontSize: '12px',
        marginRight: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    };

    const styles = {
        xboxA: { ...btnStyle, background: '#27ae60', color: 'white' },
        xboxB: { ...btnStyle, background: '#e74c3c', color: 'white' },
        xboxX: { ...btnStyle, background: '#3498db', color: 'white' },
        xboxY: { ...btnStyle, background: '#f1c40f', color: 'black' },
        trigger: {
            ...btnStyle,
            width: 'auto',
            borderRadius: '4px',
            background: '#333',
            border: '1px solid #555',
            padding: '0 6px',
            fontSize: '11px'
        }
    };

    return (
        <>
            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div style={toastStyle}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2rem', fontWeight: '900', letterSpacing: '2px' }}>
                        CONTROLLER CONNECTED
                    </div>
                </div>
            )}

            {/* CORNER HINTS */}
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <span style={{ fontSize: '18px' }}>🎮</span>
                    <span>Ready</span>
                </div>

                <div style={rowStyle}>
                    <div><span style={styles.xboxA}>A</span> Jump / Fly</div>
                </div>
                <div style={rowStyle}>
                    <div><span style={styles.xboxB}>B</span> Dash / Boost</div>
                </div>
                <div style={rowStyle}>
                    <div><span style={styles.xboxX}>X</span> Use Item</div>
                </div>
                <div style={rowStyle}>
                    <div><span style={styles.xboxY}>Y</span> Fullscreen</div>
                </div>
                <div style={rowStyle}>
                    <div><span style={styles.trigger}>LT</span> + <span style={styles.trigger}>RT</span> Turbo</div>
                </div>
            </div>

            <style>{`
                @keyframes popIn {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    80% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default ControllerHints;

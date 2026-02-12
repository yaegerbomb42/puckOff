import React, { useEffect, useState } from 'react';

const ControllerHints = ({ visible }) => {
    const [activeController, setActiveController] = useState(false);

    useEffect(() => {
        const handleConnect = () => setActiveController(true);
        const handleDisconnect = () => setActiveController(false);

        window.addEventListener('gamepadconnected', handleConnect);
        window.addEventListener('gamepaddisconnected', handleDisconnect);

        // Check initial state
        if (navigator.getGamepads?.()[0]) setActiveController(true);

        return () => {
            window.removeEventListener('gamepadconnected', handleConnect);
            window.removeEventListener('gamepaddisconnected', handleDisconnect);
        };
    }, []);

    if (!activeController && !visible) return null;

    const styles = {
        container: {
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '15px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            zIndex: 100,
            width: '280px',
            transition: 'opacity 0.3s ease',
            opacity: activeController || visible ? 1 : 0,
            pointerEvents: 'none',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#00d4ff'
        },
        row: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '12px',
            color: '#ccc'
        },
        btn: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            fontWeight: 'bold',
            fontSize: '12px',
            marginRight: '8px'
        },
        xboxA: { background: '#27ae60', color: 'white' },
        xboxB: { background: '#e74c3c', color: 'white' },
        xboxX: { background: '#3498db', color: 'white' },
        xboxY: { background: '#f1c40f', color: 'black' },
        trigger: {
            background: '#333',
            border: '1px solid #555',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={{ fontSize: '18px' }}>🎮</span>
                <span>Controller Connected</span>
            </div>

            <div style={styles.row}>
                <div><span style={{ ...styles.btn, ...styles.xboxA }}>A</span> Jump / Fly</div>
            </div>
            <div style={styles.row}>
                <div><span style={{ ...styles.btn, ...styles.xboxB }}>B</span> Dash / Boost</div>
            </div>
            <div style={styles.row}>
                <div><span style={{ ...styles.btn, ...styles.xboxX }}>X</span> Use Powerup</div>
            </div>
            <div style={styles.row}>
                <div><span style={{ ...styles.btn, ...styles.trigger }}>LT</span> + <span style={{ ...styles.btn, ...styles.trigger }}>RT</span> Power Dive</div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#888', fontStyle: 'italic', borderTop: '1px solid #333', paddingTop: '8px' }}>
                Tip: Hold Jump to hover. Double-tap B to dodge mid-air.
            </div>
        </div>
    );
};

export default ControllerHints;

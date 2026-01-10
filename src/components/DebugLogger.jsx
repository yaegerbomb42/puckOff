import React, { useState, useEffect, useRef } from 'react';

export default function DebugLogger({ visible = true }) {
    const [logs, setLogs] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        const handleLog = (e) => {
            const { message, type } = e.detail;
            setLogs(prev => [...prev.slice(-19), {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString().split(' ')[0],
                message,
                type
            }]);
        };

        window.addEventListener('game-log', handleLog);
        return () => window.removeEventListener('game-log', handleLog);
    }, []);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '300px',
            height: '200px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '10px',
            padding: '10px',
            fontFamily: 'monospace',
            color: '#0f0',
            fontSize: '12px',
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 9999,
            border: '1px solid #333'
        }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '2px', color: '#fff', fontWeight: 'bold' }}>
                🚀 DEBUG LOGS
            </div>
            <div style={{ height: '160px', overflowY: 'auto' }}>
                {logs.map(log => (
                    <div key={log.id} style={{ marginBottom: '2px', color: log.type === 'error' ? '#f00' : (log.type === 'warn' ? '#fb0' : '#0f0') }}>
                        <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {log.message}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

// Helper to emit logs
export const logGame = (message, type = 'info') => {
    window.dispatchEvent(new CustomEvent('game-log', { detail: { message, type } }));
};

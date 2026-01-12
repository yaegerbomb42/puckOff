import React, { useState } from 'react';

export default function SandboxControls({ onSpawnPowerup, onReset, onToggleDebug, debugMode }) {
    const POWERUPS = [
        { id: 'speed_boost', icon: '⚡' },
        { id: 'rocket', icon: '🚀' },
        { id: 'shield', icon: '🛡️' },
        { id: 'teleport', icon: '🔮' },
        { id: 'bomb_throw', icon: '💣' },
        { id: 'ghost', icon: '👻' },
        { id: 'giant', icon: '🍄' },
        { id: 'freeze_ray', icon: '❄️' },
        { id: 'grapple', icon: '🪝' },
        { id: 'shrink', icon: '🐜' },
        { id: 'cursed', icon: '☠️' }
    ];

    return (
        <div className="sandbox-controls">
            <div className="sandbox-header">
                <h3>🧪 SANDBOX TOOLS</h3>
                <div className="sandbox-actions">
                    <button className={`btn-tool ${debugMode ? 'active' : ''}`} onClick={onToggleDebug}>
                        🐞 DEBUG
                    </button>
                    <button className="btn-tool" onClick={onReset}>
                        🔄 RESET
                    </button>
                </div>
            </div>

            <div className="powerup-grid">
                {POWERUPS.map(p => (
                    <button
                        key={p.id}
                        className="btn-powerup"
                        onClick={() => onSpawnPowerup(p.id)}
                        title={`Spawn ${p.id}`}
                    >
                        {p.icon}
                    </button>
                ))}
            </div>

            <style jsx>{`
                .sandbox-controls {
                    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.8); border: 2px solid #00ff87;
                    border-radius: 20px; padding: 1rem;
                    display: flex; flex-direction: column; gap: 1rem;
                    z-index: 100;
                }
                .sandbox-header {
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid #333; padding-bottom: 0.5rem;
                }
                .sandbox-header h3 { margin: 0; color: #00ff87; font-size: 1rem; }
                
                .sandbox-actions { display: flex; gap: 0.5rem; }
                .btn-tool {
                    padding: 0.3rem 0.8rem; border-radius: 5px; border: 1px solid #555;
                    background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;
                    font-size: 0.8rem;
                }
                .btn-tool:hover { background: rgba(255,255,255,0.2); }
                .btn-tool.active { background: #ff006e; border-color: #ff006e; }

                .powerup-grid {
                    display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;
                }
                .btn-powerup {
                    width: 40px; height: 40px; border-radius: 8px; border: 1px solid #333;
                    background: rgba(0,0,0,0.5); font-size: 1.5rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: transform 0.1s;
                }
                .btn-powerup:hover {
                    transform: scale(1.1); background: rgba(0,255,135,0.2); border-color: #00ff87;
                }
            `}</style>
        </div>
    );
}

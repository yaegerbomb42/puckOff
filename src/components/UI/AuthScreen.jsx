import React from 'react';
import { audio } from '../../utils/audio';

export default function AuthScreen({ onLogin, onOffline }) {
    return (
        <div className="auth-screen">
            <div className="auth-container">
                <div className="logo-section">
                    <h1 className="game-title">puck<span>OFF</span></h1>
                    <p className="subtitle">ULTIMATE ARENA COMBAT</p>
                </div>

                <div className="auth-actions">
                    <button
                        className="btn btn-primary btn-large shimmer"
                        onClick={() => {
                            audio.playClick();
                            onLogin();
                        }}
                    >
                        🔵 SIGN IN WITH GOOGLE
                    </button>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <button
                        className="btn btn-secondary btn-large"
                        onClick={() => {
                            audio.playClick();
                            onOffline();
                        }}
                    >
                        🎮 PLAY OFFLINE
                    </button>
                </div>

                <div className="version-tag">
                    v2.1.0-beta
                </div>
            </div>

            <style jsx>{`
                .auth-screen {
                    position: fixed;
                    inset: 0;
                    background: url('/images/lobby_background.png') center center / cover no-repeat;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Orbitron', sans-serif;
                    z-index: 9999;
                }
                .auth-screen::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(10,10,26,0.9) 0%, rgba(26,10,46,0.85) 50%, rgba(10,26,46,0.9) 100%);
                    backdrop-filter: blur(5px);
                }

                .auth-container {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3rem;
                    padding: 3rem;
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    border-radius: 20px;
                    background: rgba(0, 0, 0, 0.4);
                    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
                    width: 100%;
                    max-width: 450px;
                    animation: fadeIn 0.5s ease-out;
                }

                .game-title {
                    font-size: 4rem;
                    margin: 0;
                    font-weight: 900;
                    letter-spacing: -2px;
                    background: linear-gradient(45deg, #00d4ff, #ff006e, #00ff87);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 0 30px rgba(0,212,255,0.3);
                    animation: titlePulse 3s infinite alternate;
                }
                .game-title span {
                    font-style: italic;
                    color: #ff006e;
                    -webkit-text-fill-color: initial;
                }

                .subtitle {
                    color: #aaa;
                    letter-spacing: 5px;
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    text-align: center;
                }

                .auth-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    width: 100%;
                }

                .btn-large {
                    width: 100%;
                    padding: 1.2rem;
                    font-size: 1.1rem;
                    font-weight: bold;
                    border-radius: 12px;
                    font-family: 'Orbitron', sans-serif;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-transform: uppercase;
                }

                .btn-primary {
                    background: linear-gradient(45deg, #00d4ff, #00ff87);
                    border: none;
                    color: #000;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
                }
                .btn-primary:hover {
                    transform: scale(1.02);
                    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
                }

                .btn-secondary {
                    background: transparent;
                    border: 2px solid #ff006e;
                    color: #ff006e;
                }
                .btn-secondary:hover {
                    background: rgba(255, 0, 110, 0.1);
                    transform: scale(1.02);
                    box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
                }

                .divider {
                    display: flex;
                    align-items: center;
                    color: #555;
                    font-size: 0.8rem;
                }
                .divider::before, .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #333;
                }
                .divider span {
                    padding: 0 1rem;
                }

                .version-tag {
                    position: absolute;
                    bottom: 1rem;
                    right: 1.5rem;
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.3);
                    font-family: monospace;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes titlePulse {
                    0% { filter: brightness(1); }
                    100% { filter: brightness(1.3); text-shadow: 0 0 50px rgba(0,212,255,0.6); }
                }

                .shimmer {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 50%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: shimmer 3s infinite;
                }
                @keyframes shimmer {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                }
            `}</style>
        </div>
    );
}

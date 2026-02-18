import React from 'react';
import './LoadingScreen.css'; // We will create this css file next

export default function LoadingScreen() {
    return (
        <div className="loading-screen-overlay">
            <div className="loader-container">
                <div className="spinner-ring"></div>
                <div className="spinner-core"></div>
                <div className="loading-text">LOADING</div>
            </div>

            <style>{`
                .loading-screen-overlay {
                    position: fixed;
                    inset: 0;
                    background: #000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                    font-family: 'Orbitron', sans-serif;
                }

                .loader-container {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner-ring {
                    position: absolute;
                    inset: 0;
                    border: 3px solid transparent;
                    border-top-color: #00d4ff;
                    border-right-color: #00ff87;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
                }

                .spinner-core {
                    width: 60%;
                    height: 60%;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                .loading-text {
                    position: absolute;
                    bottom: -40px;
                    font-size: 0.8rem;
                    letter-spacing: 0.2rem;
                    color: #fff;
                    animation: blink 1s infinite alternate;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1); opacity: 1; box-shadow: 0 0 20px rgba(0, 212, 255, 0.5); }
                }

                @keyframes blink {
                    from { opacity: 0.4; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TIERS, getCollectionStats, ZOIN_BUNDLES, BETTING_OPTS } from '../../utils/economy';
import { audio } from '../../utils/audio';
import SkeletonLoader from './SkeletonLoader';
import { useEffect, useRef } from 'react';

// Animated Counter Component
function RollingCounter({ value }) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            const diff = value - prevValue.current;
            const steps = 20;
            const stepValue = diff / steps;
            let current = prevValue.current;

            const interval = setInterval(() => {
                current += stepValue;
                if ((diff > 0 && current >= value) || (diff < 0 && current <= value)) {
                    setDisplayValue(value);
                    clearInterval(interval);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, 30);

            prevValue.current = value;
            return () => clearInterval(interval);
        }
    }, [value]);

    return <span>{displayValue.toLocaleString()}</span>;
}

export default function Store({ onClose, onOpenPack }) {
    const { user, inventory, loading, spendZoins } = useAuth();
    const stats = getCollectionStats(inventory?.icons || []);

    // Betting State
    const [selectedBet, setSelectedBet] = useState('standard');
    const [isOpening, setIsOpening] = useState(false);

    // [PSYCH] Hide prices until clicked state
    const [showPriceFor, setShowPriceFor] = useState(null);

    const handleOpenPack = async () => {
        if (!user || isOpening) return;

        const bet = BETTING_OPTS[selectedBet];
        if ((inventory?.zoins || 0) < bet.cost) {
            // "Low on Fuel?"
            const buySection = document.getElementById('buy-zoins');
            if (buySection) buySection.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setIsOpening(true);
        audio.playClick();

        const success = await spendZoins(bet.cost);
        if (success) {
            onOpenPack(bet.cost);
        }
        setIsOpening(false);
    };

    return (
        <div className="store-overlay">
            <div className="store-header">
                <div className="header-info">
                    <h2>🎰 ICON VAULT</h2>
                    <div className="stats-row">
                        {loading ? (
                            <SkeletonLoader width="150px" height="30px" />
                        ) : (
                            <div className="stat-badge zoins">
                                <span className="z-icon">Z</span> <RollingCounter value={inventory?.zoins || 0} /> Zoins
                            </div>
                        )}
                    </div>
                </div>
                {!user && !loading && <div className="auth-nag">Sign in to save progress!</div>}

                <div className="collection-progress">
                    {loading ? (
                        <SkeletonLoader width="150px" height="24px" />
                    ) : (
                        `📦 ${stats.owned}/${stats.total} (${stats.percentage}%)`
                    )}
                </div>
                <button className="close-btn" onClick={() => { audio.playClick(); onClose(); }}>✕</button>
            </div>

            <div className="store-content">
                {/* 1. HIGH ROLLER BETTING SECTION */}
                <div className="betting-section">
                    <h3>🎲 HIGH ROLLER</h3>
                    <p className="section-desc">Wager Zoins to boost your luck. Higher bets = Better drops.</p>

                    <div className="bet-selector">
                        {Object.entries(BETTING_OPTS).map(([key, opt]) => (
                            <button
                                key={key}
                                className={`bet-card ${selectedBet === key ? 'selected' : ''}`}
                                onClick={() => { audio.playClick(); setSelectedBet(key); }}
                            >
                                <div className="bet-name">{opt.name}</div>
                                <div className="bet-cost">
                                    <span className="z-icon">Z</span> {opt.cost}
                                </div>
                                <div className="bet-multiplier">
                                    Luck: <span className="highlight">{opt.multiplier}x</span>
                                </div>
                                {key === 'standard' && <div className="refund-text">Get 5 Z Back!</div>} {/* Visual Lie */}
                            </button>
                        ))}
                    </div>

                    <button
                        className={`btn-roll ${!user || (inventory?.zoins || 0) < BETTING_OPTS[selectedBet].cost ? 'disabled' : ''}`}
                        onClick={handleOpenPack}
                        disabled={!user || (inventory?.zoins || 0) < BETTING_OPTS[selectedBet].cost || isOpening}
                    >
                        {isOpening ? 'ROLLING...' : (
                            (!user || (inventory?.zoins || 0) >= BETTING_OPTS[selectedBet].cost)
                                ? 'ROLL FOR LOOT'
                                : 'LOW FUEL - TOP UP'
                        )}
                    </button>
                </div>

                {/* 2. ZOIN BUNDLES SECTION (FUEL) */}
                <div id="buy-zoins" className="bundles-section">
                    <h3>⛽ REFUEL STATION</h3>
                    <p className="section-desc">Keep the action going. Instant top-up.</p>
                    <div className="bundles-grid">
                        {Object.values(ZOIN_BUNDLES).map((bundle) => (
                            <div key={bundle.id} className={`bundle-card ${bundle.id}`}>
                                <div className="bundle-name">{bundle.name}</div>
                                <div className="bundle-amount">
                                    <span className="z-icon">Z</span> {bundle.zoins.toLocaleString()}
                                </div>
                                <div className="bundle-price">${bundle.price}</div>

                                {showPriceFor === bundle.id ? (
                                    <button
                                        className="btn-buy confirm"
                                        onClick={() => {
                                            audio.playClick();
                                            window.open(bundle.stripeLink, '_blank');
                                            setShowPriceFor(null);
                                        }}
                                    >
                                        CONFIRM ${bundle.price}
                                    </button>
                                ) : (
                                    <button
                                        className="btn-buy"
                                        onClick={() => {
                                            audio.playClick();
                                            setShowPriceFor(bundle.id);
                                        }}
                                    >
                                        UNLOCK
                                    </button>
                                )}

                                {/* "Almost There" Logic Visual */}
                                {bundle.id === 'pouch' && <div className="efficiency-text">Starts ~2 High Rollers</div>}
                                {bundle.id === 'cache' && <div className="efficiency-text text-good">Best Value</div>}
                                {bundle.id === 'vault' && <div className="efficiency-text text-best">Max Efficiency</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. TIER PREVIEW */}
                <div className="tier-section">
                    <h4>DROP RATES (Base)</h4>
                    <div className="tier-grid">
                        {Object.entries(TIERS).map(([id, tier]) => (
                            <div key={id} className="tier-chip" style={{ borderColor: tier.color }}>
                                <span className="tier-dot" style={{ background: tier.color }}></span>
                                <span className="tier-name">{tier.name}</span>
                                <span className="tier-rate">{(tier.dropRate * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .store-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, rgba(8, 8, 20, 0.98), rgba(15, 10, 30, 0.98));
                    backdrop-filter: blur(15px);
                    z-index: 1000;
                    display: flex; flex-direction: column;
                    padding: 2rem;
                    color: white;
                    font-family: 'Orbitron', sans-serif;
                    overflow-y: auto;
                }
                .store-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 1rem;
                }
                .store-header h2 { font-size: 2rem; margin: 0; color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
                
                .stat-badge.zoins {
                    background: rgba(255, 215, 0, 0.1);
                    border: 1px solid #ffd700;
                    color: #ffd700;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 1.2rem;
                    display: flex; align-items: center; gap: 0.5rem;
                }
                .z-icon {
                    background: #ffd700; color: #000;
                    width: 20px; height: 20px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 0.8rem;
                }

                .close-btn {
                    background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer;
                    opacity: 0.7; transition: opacity 0.2s;
                }
                .close-btn:hover { opacity: 1; transform: scale(1.1); }

                /* BETTING SECTION */
                .betting-section {
                    background: rgba(0,0,0,0.3);
                    border-radius: 20px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .section-desc { color: #aaa; margin-bottom: 1.5rem; font-family: 'Inter', sans-serif; }
                
                .bet-selector {
                    display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                
                .bet-card {
                    background: rgba(255,255,255,0.03);
                    border: 2px solid rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 1.5rem;
                    width: 180px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-align: center;
                }
                .bet-card:hover {
                    background: rgba(255,255,255,0.08);
                    transform: translateY(-5px);
                }
                .bet-card.selected {
                    background: rgba(255, 215, 0, 0.1);
                    border-color: #ffd700;
                    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
                    transform: translateY(-5px) scale(1.05);
                }
                
                .bet-name { color: #fff; margin-bottom: 0.5rem; font-weight: bold; }
                .bet-cost { 
                    font-size: 1.5rem; color: #ffd700; margin-bottom: 0.5rem; 
                    display: flex; align-items: center; justify-content: center; gap: 0.3rem;
                }
                .bet-multiplier { color: #aaa; font-size: 0.8rem; }
                .bet-multiplier .highlight { color: #00ff87; font-weight: bold; }

                .btn-roll {
                    background: linear-gradient(45deg, #ffd700, #ff8c00);
                    color: black;
                    border: none;
                    padding: 1rem 4rem;
                    font-size: 1.5rem;
                    font-weight: 900;
                    border-radius: 50px;
                    cursor: pointer;
                    box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
                    transition: all 0.2s;
                    text-transform: uppercase;
                }
                .btn-roll:hover:not(.disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 0 50px rgba(255, 215, 0, 0.6);
                }
                .btn-roll.disabled {
                    background: #444; color: #888;
                    cursor: not-allowed; box-shadow: none;
                }

                /* BUNDLES SECTION */
                .bundles-section {
                    margin-bottom: 3rem;
                    text-align: center;
                }
                .bundles-grid {
                    display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;
                }
                .bundle-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2));
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 1.5rem;
                    width: 200px;
                    transition: transform 0.3s;
                }
                .bundle-card:hover { transform: translateY(-5px); }
                .bundle-card.vault { border-color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.1); }
                
                .bundle-amount { 
                    font-size: 1.8rem; color: #ffd700; margin-bottom: 0.5rem; 
                    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                }
                .bundle-price { font-size: 1.2rem; color: #aaa; margin-bottom: 1rem; }
                
                .btn-buy {
                    background: transparent; border: 1px solid #ffd700;
                    color: #ffd700; padding: 0.5rem 1rem;
                    border-radius: 20px; cursor: pointer;
                    font-weight: bold; transition: all 0.2s;
                    width: 100%;
                }
                .btn-buy:hover { background: #ffd700; color: black; }
                
                /* Psych additions */
                .refund-text { 
                    font-size: 0.7rem; color: #00ff87; margin-top: 0.5rem; 
                    animation: pulse 2s infinite; font-weight: bold;
                }
                .bundle-name {
                    font-size: 1rem; color: #aaa; margin-bottom: 0.2rem;
                    text-transform: uppercase; letter-spacing: 1px;
                }
                .efficiency-text {
                    font-size: 0.8rem; color: #aaa; margin-top: 0.5rem;
                    font-style: italic;
                }
                .text-good { color: #00ff87; font-weight: bold; }
                .text-best { color: #8b5cf6; font-weight: bold; text-shadow: 0 0 5px rgba(139, 92, 246, 0.5); }
                
                .btn-buy.confirm {
                    background: #00ff87; color: black; border-color: #00ff87;
                    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes popIn {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }

                /* TIERS */
                .tier-section { text-align: center; opacity: 0.7; }
                .tier-grid { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; }
                .tier-chip {
                    display: flex; align-items: center; gap: 0.4rem;
                    border: 1px solid; border-radius: 15px;
                    padding: 0.3rem 0.6rem; font-size: 0.7rem;
                }
                .tier-dot { width: 8px; height: 8px; border-radius: 50%; }

                /* Scrollbar */
                .store-overlay::-webkit-scrollbar { width: 8px; }
                .store-overlay::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
                .store-overlay::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
            `}</style>
        </div>
    );
}

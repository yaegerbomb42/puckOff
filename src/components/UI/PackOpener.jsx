import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { openPack, TIERS } from '../../utils/economy';
import { audio } from '../../utils/audio';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Float, PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';

// ============================================
// CSGO-STYLE ROULETTE PACK OPENER
// ============================================

// --- 3D Background Components ---

function ParticleBurst({ color = "#00d4ff", count = 100 }) {
    const ref = useRef();
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        return pos;
    }, [count]);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.001;
            ref.current.rotation.x += 0.0005;
        }
    });

    return (
        <Points ref={ref} positions={positions} stride={3}>
            <PointMaterial transparent color={color} size={0.08} sizeAttenuation depthWrite={false} />
        </Points>
    );
}

function CameraShake({ intensity = 0 }) {
    useFrame((state) => {
        if (intensity > 0) {
            state.camera.position.x += (Math.random() - 0.5) * intensity * 0.02;
            state.camera.position.y += (Math.random() - 0.5) * intensity * 0.02;
        }
    });
    return null;
}

// Pack 3D Model
function Pack3D({ onClick, color = "#00d4ff", opening }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += opening ? 0.15 : 0.005;
            if (opening) {
                meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 20) * 0.1);
            }
        }
    });

    return (
        <mesh ref={meshRef} onClick={onClick} castShadow>
            <boxGeometry args={[2, 2.8, 0.4]} />
            <meshStandardMaterial
                color="#111"
                metalness={0.8}
                roughness={0.2}
                emissive={color}
                emissiveIntensity={opening ? 3 : 0.5}
            />
        </mesh>
    );
}

// --- Roulette Strip Item ---
function RouletteItem({ item, isCenter, isRevealed }) {
    const tier = item.tier ? TIERS[item.tier] : null;
    const isFreePack = item.type === 'free_pack_token';
    const isMystery = tier?.isMystery;
    const color = tier?.color || '#00ff87';
    const rarityName = isFreePack ? 'BONUS' : (isMystery ? '???' : tier?.name?.toUpperCase() || 'COMMON');

    return (
        <div className={`roulette-item ${isCenter ? 'center-item' : ''} ${isRevealed ? 'revealed-winner' : ''}`}>
            <div className="item-rarity-bar" style={{ background: color }} />
            <div className="item-content">
                <div className="item-icon">
                    {isFreePack ? '🎟️' : (isMystery ? '🔮' : '⭐')}
                </div>
                <div className="item-label" style={{ color }}>
                    {rarityName}
                </div>
            </div>
            <div className="item-glow" style={{ background: `radial-gradient(circle, ${color}44, transparent)` }} />

            <style jsx>{`
                .roulette-item {
                    flex-shrink: 0;
                    width: 140px;
                    height: 160px;
                    background: linear-gradient(180deg, #1a1a2e, #0a0a14);
                    border: 2px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    transition: border-color 0.3s, transform 0.3s;
                }
                .roulette-item.center-item {
                    border-color: rgba(255,255,255,0.4);
                }
                .roulette-item.revealed-winner {
                    border-color: ${color};
                    transform: scale(1.05);
                    box-shadow: 0 0 40px ${color}66, inset 0 0 20px ${color}22;
                }
                .item-rarity-bar {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 4px;
                }
                .item-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    z-index: 2;
                }
                .item-icon {
                    font-size: 3.5rem;
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
                }
                .item-label {
                    font-weight: 900;
                    font-size: 0.7rem;
                    letter-spacing: 2px;
                    font-family: 'Orbitron', sans-serif;
                }
                .item-glow {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .revealed-winner .item-glow {
                    opacity: 1;
                    animation: pulseGlow 1s infinite alternate;
                }
                @keyframes pulseGlow {
                    from { opacity: 0.4; }
                    to { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}

// --- Main Pack Opener ---
export default function PackOpener({ packType = 'single', onClose, onClaimRewards }) {
    const [step, setStep] = useState('sealed');       // sealed → opening → spinning → landed → complete
    const [slots, setSlots] = useState([]);
    const [activeColor, setActiveColor] = useState("#00d4ff");
    const [shakeIntensity, setShakeIntensity] = useState(0);

    // Roulette state
    const stripRef = useRef(null);
    const velocityRef = useRef(0);
    const targetOffsetRef = useRef(0);
    const animFrameRef = useRef(null);
    const tickCountRef = useRef(0);
    const [winnerIndex, setWinnerIndex] = useState(-1);

    // Build roulette strip — lots of filler items surrounding the real results
    const reelItems = useMemo(() => {
        if (slots.length === 0) return [];

        // Create a long reel of random items with the winner placed near the end
        const reel = [];
        const totalVisible = 40; // Total items in the reel
        const winPos = 30 + Math.floor(Math.random() * 5); // Winner position

        for (let i = 0; i < totalVisible; i++) {
            if (i === winPos) {
                // The actual winning item (first slot result)
                reel.push({ ...slots[0], _isWinner: true, _index: i });
            } else {
                // Random filler from the pack pool
                const fillerSlot = slots[Math.floor(Math.random() * slots.length)];
                reel.push({ ...fillerSlot, _isWinner: false, _index: i });
            }
        }

        return { items: reel, winnerPos: winPos };
    }, [slots]);

    // Generate pack contents on mount
    useEffect(() => {
        const packContents = openPack(packType);
        setSlots(packContents);
        if (packType === 'bundle10') setActiveColor("#a855f7");
    }, [packType]);

    // Ref to break circular dependency
    const startRouletteRef = useRef(null);

    // Handle pack click → start opening sequence
    const handleOpen = useCallback(() => {
        if (step !== 'sealed') return;
        audio.playClick();
        setStep('opening');

        // After dramatic pack-open animation, start spinning
        setTimeout(() => {
            setStep('spinning');
            startRouletteRef.current?.();
        }, 1800);
    }, [step]);

    // Start the roulette spin with physics-based deceleration
    const startRoulette = useCallback(() => {
        if (!reelItems.items) return;

        const ITEM_WIDTH = 152; // 140px + 12px gap
        const winPos = reelItems.winnerPos;

        // Target: scroll so the winner lands under the center indicator
        // Center of viewport is half the container width; winner needs to be there
        const viewportCenter = window.innerWidth / 2;
        const targetOffset = (winPos * ITEM_WIDTH) - viewportCenter + (ITEM_WIDTH / 2);

        targetOffsetRef.current = targetOffset;
        velocityRef.current = 60; // Initial velocity (pixels per frame)
        tickCountRef.current = 0;

        const animate = () => {
            const target = targetOffsetRef.current;
            const current = stripRef.current?._currentOffset || 0;

            // Deceleration curve — ease out exponentially
            const progress = Math.min(current / target, 1);
            const easeMultiplier = Math.max(0.3, 1 - progress * 0.95);
            velocityRef.current = Math.max(0.5, velocityRef.current * (0.985 + easeMultiplier * 0.01));

            const newOffset = Math.min(current + velocityRef.current, target);

            // Tick sound when crossing item boundaries
            const oldItem = Math.floor(current / ITEM_WIDTH);
            const newItem = Math.floor(newOffset / ITEM_WIDTH);
            if (newItem !== oldItem) {
                tickCountRef.current++;
                // Tick gets louder and slower as we approach
                try { audio.playClick(); } catch (e) { }

                // Shake increases as we approach target
                const proximityToEnd = 1 - Math.abs(target - newOffset) / target;
                setShakeIntensity(proximityToEnd * 3);
            }

            if (stripRef.current) {
                stripRef.current._currentOffset = newOffset;
                stripRef.current.style.transform = `translateX(-${newOffset}px)`;
            }

            if (newOffset >= target - 0.5) {
                // Landed!
                if (stripRef.current) {
                    stripRef.current._currentOffset = target;
                    stripRef.current.style.transform = `translateX(-${target}px)`;
                }
                setWinnerIndex(reelItems.winnerPos);
                setShakeIntensity(8); // Big shake on land

                // Update color to winner's rarity
                const winnerItem = reelItems.items[reelItems.winnerPos];
                const winTier = winnerItem?.tier ? TIERS[winnerItem.tier] : null;
                if (winTier) setActiveColor(winTier.color);

                setTimeout(() => {
                    setShakeIntensity(0);
                    setStep('landed');
                }, 600);

                setTimeout(() => {
                    setStep('complete');
                }, 2500);

                return; // Stop animation
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        // Initialize
        if (stripRef.current) stripRef.current._currentOffset = 0;
        animFrameRef.current = requestAnimationFrame(animate);
    }, [reelItems]);

    // Keep ref in sync
    startRouletteRef.current = startRoulette;

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Claim rewards
    const handleClaim = useCallback(() => {
        const rewards = slots.filter(s => s.type === 'icon').map(s => s.iconId);
        const freePackCount = slots.filter(s => s.type === 'free_pack_token').length;
        if (onClaimRewards) {
            onClaimRewards({ icons: rewards, freePacks: freePackCount });
        }
        onClose();
    }, [slots, onClaimRewards, onClose]);

    return (
        <div className={`opener-overlay ${step}`}>
            {/* 3D Background */}
            <div className={`background-canvas ${step === 'spinning' || step === 'landed' ? 'dim' : ''}`}>
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <CameraShake intensity={shakeIntensity} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color={activeColor} />

                    {(step === 'sealed' || step === 'opening') && (
                        <Float speed={step === 'opening' ? 10 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
                            <Pack3D
                                onClick={handleOpen}
                                color={activeColor}
                                opening={step === 'opening'}
                            />
                        </Float>
                    )}

                    <ParticleBurst
                        color={activeColor}
                        count={step === 'opening' ? 500 : step === 'landed' ? 800 : 100}
                    />
                    <Environment preset="night" />
                </Canvas>
            </div>

            {/* UI Content Layer */}
            <div className="content-layer">
                {/* Sealed state — tap to open */}
                {step === 'sealed' && (
                    <div className="tutorial-text">
                        <h2 className="glitch-text">TAP PACK TO OPEN</h2>
                    </div>
                )}

                {/* Opening animation text */}
                {step === 'opening' && (
                    <div className="opening-text">
                        <h1 className="crack-text">CRACKING OPEN...</h1>
                    </div>
                )}

                {/* Roulette strip */}
                {(step === 'spinning' || step === 'landed' || step === 'complete') && reelItems.items && (
                    <div className="roulette-container">
                        {/* Center indicator arrow */}
                        <div className="center-indicator">
                            <div className="indicator-arrow" />
                            <div className="indicator-line" style={{ boxShadow: `0 0 15px ${activeColor}` }} />
                        </div>

                        {/* Scrolling strip */}
                        <div className="roulette-viewport">
                            <div className="roulette-strip" ref={stripRef}>
                                {reelItems.items.map((item, idx) => (
                                    <RouletteItem
                                        key={idx}
                                        item={item}
                                        isCenter={idx === winnerIndex}
                                        isRevealed={step === 'landed' || step === 'complete'}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Result announcement */}
                        {(step === 'landed' || step === 'complete') && (
                            <div className="winner-announcement" style={{ color: activeColor }}>
                                <h1 className="winner-text">
                                    {reelItems.items[reelItems.winnerPos]?.type === 'free_pack_token'
                                        ? '🎟️ BONUS PACK!'
                                        : `⭐ ${TIERS[reelItems.items[reelItems.winnerPos]?.tier]?.name?.toUpperCase() || 'ITEM'} UNLOCKED!`
                                    }
                                </h1>
                            </div>
                        )}

                        {/* Additional items (for multi-packs) */}
                        {step === 'complete' && slots.length > 1 && (
                            <div className="bonus-items">
                                <div className="bonus-label">+ {slots.length - 1} MORE ITEMS</div>
                                <div className="bonus-row">
                                    {slots.slice(1).map((slot, idx) => (
                                        <div key={idx} className="bonus-chip" style={{
                                            borderColor: TIERS[slot.tier]?.color || '#666',
                                            boxShadow: `0 0 10px ${TIERS[slot.tier]?.color || '#666'}44`
                                        }}>
                                            {slot.type === 'free_pack_token' ? '🎟️' : '⭐'}
                                            <span style={{ color: TIERS[slot.tier]?.color || '#fff' }}>
                                                {TIERS[slot.tier]?.name || 'Item'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Claim button */}
                        {step === 'complete' && (
                            <button className="premium-claim-btn" onClick={handleClaim}>
                                CLAIM REWARDS
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .opener-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: #000; z-index: 3000;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Orbitron', 'Inter', sans-serif;
                    overflow: hidden;
                }
                .background-canvas {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 10;
                    transition: filter 0.8s, opacity 0.8s;
                }
                .background-canvas.dim {
                    filter: blur(8px) brightness(0.25);
                    opacity: 0.6;
                }

                .content-layer {
                    position: relative; z-index: 20;
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    pointer-events: none;
                }

                /* --- Sealed State --- */
                .tutorial-text {
                    position: absolute; bottom: 15%; left: 50%;
                    transform: translateX(-50%); width: 100%; text-align: center;
                }
                .glitch-text {
                    animation: glitch 1s infinite alternate;
                    font-size: 1.5rem; letter-spacing: 5px; color: #fff;
                }

                /* --- Opening State --- */
                .opening-text {
                    text-align: center;
                }
                .crack-text {
                    font-size: 3rem; letter-spacing: 8px; color: #fff;
                    text-shadow: 0 0 40px ${activeColor}, 0 0 80px ${activeColor};
                    animation: crackPulse 0.3s infinite alternate;
                }
                @keyframes crackPulse {
                    from { transform: scale(1); opacity: 1; }
                    to { transform: scale(1.05); opacity: 0.8; }
                }

                /* --- Roulette Container --- */
                .roulette-container {
                    position: relative;
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    pointer-events: auto;
                }

                /* Center indicator */
                .center-indicator {
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 30;
                    pointer-events: none;
                }
                .indicator-arrow {
                    width: 0; height: 0;
                    border-left: 14px solid transparent;
                    border-right: 14px solid transparent;
                    border-top: 20px solid ${activeColor};
                    margin: 0 auto;
                    filter: drop-shadow(0 0 8px ${activeColor});
                    position: relative;
                    top: -84px;
                }
                .indicator-line {
                    width: 3px; height: 170px;
                    background: ${activeColor};
                    margin: 0 auto;
                    position: relative;
                    top: -84px;
                    opacity: 0.6;
                }

                /* Roulette viewport */
                .roulette-viewport {
                    width: 100%;
                    overflow: hidden;
                    padding: 20px 0;
                }
                .roulette-strip {
                    display: flex;
                    gap: 12px;
                    padding-left: 50%;
                    will-change: transform;
                }

                /* Winner announcement */
                .winner-announcement {
                    margin-top: 2rem;
                    text-align: center;
                    animation: winnerPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .winner-text {
                    font-size: 2.5rem;
                    letter-spacing: 6px;
                    text-shadow: 0 0 30px currentColor;
                }
                @keyframes winnerPop {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                /* Bonus items for multi-packs */
                .bonus-items {
                    margin-top: 1.5rem;
                    text-align: center;
                }
                .bonus-label {
                    color: rgba(255,255,255,0.5);
                    font-size: 0.9rem;
                    letter-spacing: 3px;
                    margin-bottom: 0.8rem;
                }
                .bonus-row {
                    display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
                }
                .bonus-chip {
                    padding: 6px 14px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: flex; gap: 6px; align-items: center;
                    color: #fff;
                }

                /* Claim button */
                .premium-claim-btn {
                    margin-top: 2rem; padding: 1.2rem 5rem;
                    background: linear-gradient(45deg, #00ff87, #00d4ff);
                    border: none; border-radius: 40px; color: #000;
                    font-size: 1.5rem; font-weight: 800; cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    box-shadow: 0 0 30px rgba(0,255,135,0.4);
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                .premium-claim-btn:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 0 60px rgba(0,255,135,0.8);
                }

                @keyframes glitch {
                    0% { transform: skew(0); text-shadow: 0 0 0 #fff; }
                    10% { transform: skew(2deg); text-shadow: 2px 0 #ff006e, -2px 0 #00d4ff; }
                    20% { transform: skew(-2deg); text-shadow: -2px 0 #ff006e, 2px 0 #00d4ff; }
                    100% { transform: skew(0); text-shadow: 0 0 10px #fff; }
                }
            `}</style>
        </div>
    );
}

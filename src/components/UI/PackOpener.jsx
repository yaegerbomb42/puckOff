import React, { useState, useEffect, useCallback, useRef } from 'react';
import { openPack, TIERS } from '../../utils/economy';
import { audio } from '../../utils/audio';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Stars, Float, PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const REVEAL_DELAY = 1000;

// High-Dopamine Particle System
function ParticleBurst({ color = "#00d4ff", count = 100 }) {
    const points = useRef();
    const [positions] = useState(() => {
        const arr = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3] = 0;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = 0;
            velocities[i * 3] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
        return { positions: arr, velocities };
    });

    useFrame(() => {
        if (points.current) {
            const arr = points.current.geometry.attributes.position.array;
            for (let i = 0; i < count; i++) {
                arr[i * 3] += positions.velocities[i * 3];
                arr[i * 3 + 1] += positions.velocities[i * 3 + 1];
                arr[i * 3 + 2] += positions.velocities[i * 3 + 2];
            }
            points.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <Points ref={points} positions={positions.positions}>
            <PointMaterial
                transparent
                color={color}
                size={0.15}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

// 3D Pack Component
function Pack3D({ onClick, color = "#00d4ff", opening }) {
    const mesh = useRef();

    useFrame((state) => {
        if (!mesh.current) return;
        const t = state.clock.getElapsedTime();

        if (opening) {
            mesh.current.rotation.x += 0.2;
            mesh.current.rotation.y += 0.2;
            mesh.current.scale.multiplyScalar(1.05);
        } else {
            // Floating animation
            mesh.current.position.y = Math.sin(t * 2) * 0.2;
            mesh.current.rotation.y = Math.sin(t * 1) * 0.2;
            mesh.current.rotation.z = Math.sin(t * 0.5) * 0.1;
        }
    });

    return (
        <mesh ref={mesh} onClick={onClick} scale={opening ? [1, 1, 1] : [1.5, 2, 0.5]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
                color={color}
                metalness={0.9}
                roughness={0.2}
                emissive={color}
                emissiveIntensity={0.2}
            />
            {/* Edge highlights */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                <lineBasicMaterial color="white" />
            </lineSegments>
        </mesh>
    );
}

export default function PackOpener({ packType = 'single', onClose, onClaimRewards }) {
    const [step, setStep] = useState('sealed'); // sealed, opening, revealing, complete
    const [slots, setSlots] = useState([]);
    const [revealedCount, setRevealedCount] = useState(0);
    const [activeColor, setActiveColor] = useState("#00d4ff");

    useEffect(() => {
        const packContents = openPack(packType);
        setSlots(packContents.map(slot => ({ ...slot, revealed: false })));
        // Set initial color based on pack type
        if (packType === 'bundle10') setActiveColor("#a855f7"); // Purple for bundle
    }, [packType]);

    const handleOpen = () => {
        if (step !== 'sealed') return;
        audio.playClick();
        setStep('opening');
        setTimeout(() => {
            setStep('revealing');
            revealNextSlot();
        }, 1500);
    };

    const revealNextSlot = useCallback(() => {
        setSlots(prev => {
            const next = [...prev];
            const unrevealedIdx = next.findIndex(s => !s.revealed);
            if (unrevealedIdx !== -1) {
                next[unrevealedIdx].revealed = true;
                const tier = next[unrevealedIdx].tier ? TIERS[next[unrevealedIdx].tier] : null;
                if (tier) setActiveColor(tier.color);
            }
            return next;
        });
        setRevealedCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (step === 'revealing' && revealedCount < slots.length && revealedCount > 0) {
            const timer = setTimeout(revealNextSlot, REVEAL_DELAY);
            return () => clearTimeout(timer);
        } else if (step === 'revealing' && revealedCount >= slots.length) {
            setTimeout(() => setStep('complete'), 800);
        }
    }, [revealedCount, slots.length, step, revealNextSlot]);

    const handleClaim = () => {
        const rewards = slots.filter(s => s.type === 'icon').map(s => s.iconId);
        const freePackCount = slots.filter(s => s.type === 'free_pack_token').length;
        if (onClaimRewards) {
            onClaimRewards({ icons: rewards, freePacks: freePackCount });
        }
        onClose();
    };

    return (
        <div className={`opener-overlay ${step}`}>
            <div className={`background-canvas ${step !== 'sealed' ? 'blur' : ''}`}>
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color={activeColor} />
                    <pointLight position={[-10, -10, -5]} intensity={0.5} color="white" />

                    {step === 'sealed' || step === 'opening' ? (
                        <>
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                                <Pack3D
                                    onClick={handleOpen}
                                    color={activeColor}
                                    opening={step === 'opening'}
                                />
                            </Float>
                            <ParticleBurst color={activeColor} count={50} />
                        </>
                    ) : (
                        <ParticleBurst color={activeColor} count={200} />
                    )}

                    <Environment preset="night" />
                </Canvas>
            </div>

            <div className="content-layer">
                {step === 'sealed' && (
                    <div className="tutorial-text" style={{ pointerEvents: 'none' }}>
                        <h2 className="glitch-text">TAP PACK TO OPEN</h2>
                    </div>
                )}

                {(step === 'revealing' || step === 'complete') && (
                    <div className="reveal-stage">
                        <h1 className="reveal-header">
                            {step === 'complete' ? 'COLLECTION UPDATED' : 'DISCOVERING...'}
                        </h1>

                        <div className="slots-container">
                            {slots.map((slot, idx) => (
                                <SlotCard
                                    key={idx}
                                    slot={slot}
                                    revealed={slot.revealed}
                                />
                            ))}
                        </div>

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
                }
                .background-canvas {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 10;
                    transition: filter 0.5s;
                }
                .background-canvas.blur { filter: blur(5px) brightness(0.5); }
                
                .content-layer { position: relative; z-index: 20; width: 100%; text-align: center; pointer-events: none; }
                .reveal-stage { pointer-events: auto; }

                .tutorial-text {
                    position: absolute; top: 70%; left: 50%; transform: translateX(-50%);
                    width: 100%;
                }

                .glitch-text { margin-top: 3rem; animation: glitch 1s infinite alternate; }

                /* Reveal Stage */
                .reveal-stage { width: 100%; max-width: 1200px; margin: 0 auto; padding: 2rem; }
                .reveal-header { margin-bottom: 3rem; text-shadow: 0 0 20px rgba(255,255,255,0.5); }
                .slots-container {
                    display: flex; flex-wrap: wrap; gap: 2rem;
                    justify-content: center; perspective: 1000px;
                }

                .premium-claim-btn {
                    margin-top: 4rem; padding: 1.2rem 5rem;
                    background: linear-gradient(45deg, #00ff87, #00d4ff);
                    border: none; border-radius: 40px; color: #000;
                    font-size: 1.5rem; font-weight: 800; cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    box-shadow: 0 5px 30px rgba(0,255,135,0.4);
                    transition: 0.3s;
                    pointer-events: auto;
                }
                .premium-claim-btn:hover {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 10px 50px rgba(0,255,135,0.6);
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

function SlotCard({ slot, revealed }) {
    const tier = slot.tier ? TIERS[slot.tier] : null;
    const isFreePack = slot.type === 'free_pack_token';
    const isMystery = tier?.isMystery;

    return (
        <div className={`card-wrapper ${revealed ? 'revealed' : ''}`}>
            <div className="card-inner">
                {/* Back of card (unrevealed) */}
                <div className="card-back">
                    <div className="back-pattern">❓</div>
                </div>

                {/* Front of card (revealed) */}
                <div className="card-front" style={{ borderColor: tier?.color || '#00ff87' }}>
                    <div className="card-bg" style={{ background: `radial-gradient(circle at center, ${tier?.color || '#00ff87'}33, transparent)` }}></div>
                    <div className="card-rarity" style={{ background: tier?.color || '#00ff87' }}>
                        {isFreePack ? 'BONUS' : (isMystery ? '???' : tier?.name.toUpperCase())}
                    </div>
                    <div className="card-visual">
                        {isFreePack ? '🎟️' : (isMystery ? '🔮' : '⭐')}
                    </div>
                    <div className="card-name">
                        {isFreePack ? 'FREE PACK' : (isMystery ? 'HIDDEN' : `TIER ${slot.tier} ICON`)}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .card-wrapper {
                    width: 200px; height: 280px;
                    perspective: 1000px;
                }
                .card-inner {
                    position: relative; width: 100%; height: 100%;
                    transform-style: preserve-3d;
                    transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .revealed .card-inner { transform: rotateY(180deg); }

                .card-back, .card-front {
                    position: absolute; width: 100%; height: 100%;
                    backface-visibility: hidden;
                    border-radius: 20px; border: 2px solid rgba(255,255,255,0.1);
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                }

                .card-back {
                    background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
                    box-shadow: inset 0 0 20px rgba(255,255,255,0.05);
                }
                .back-pattern { font-size: 4rem; opacity: 0.3; filter: grayscale(1); }

                .card-front {
                    background: #111;
                    transform: rotateY(180deg);
                    border: 3px solid;
                    box-shadow: 0 0 30px rgba(0,0,0,0.5);
                    overflow: hidden;
                }
                .card-bg { position: absolute; inset: 0; z-index: 1; opacity: 0.6; }

                .card-rarity {
                    position: absolute; top: 15px; z-index: 2;
                    padding: 4px 15px; border-radius: 20px;
                    font-size: 0.7rem; font-weight: 900; color: #000;
                }
                .card-visual { font-size: 5rem; z-index: 2; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); }
                .card-name { z-index: 2; font-weight: bold; color: #fff; font-size: 0.9rem; letter-spacing: 1px; }

                .revealed { animation: cardPop 0.5s ease-out; }

                @keyframes cardPop {
                    0% { transform: scale(0.8); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}


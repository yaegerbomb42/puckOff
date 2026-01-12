import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Text, Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PHYSICS_CONFIG, isInKnockoutZone, canStomp, calculateStompDamage } from '../utils/physics';
import { audio } from '../utils/audio';
import useGamepad from '../hooks/useGamepad';

import { LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial } from '../utils/PuckMaterials';

// =======================================


extend({ LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial });



// ============================================
// OPTIMIZED TRAIL - Reuses geometry, no memory leak
// ============================================
function PuckTrail({ positionsRef, color, active }) {
    const lineRef = useRef();
    const geometryRef = useRef(new THREE.BufferGeometry());
    const positionsArray = useRef(new Float32Array(60)); // 20 points * 3 coords

    useFrame(() => {
        if (!lineRef.current || !active) return;

        const positions = positionsRef.current;
        if (positions.length < 2) return;

        // Update buffer in place instead of creating new geometry
        for (let i = 0; i < Math.min(positions.length, 20); i++) {
            const pos = positions[positions.length - 1 - i] || [0, 0, 0];
            positionsArray.current[i * 3] = pos[0];
            positionsArray.current[i * 3 + 1] = pos[1];
            positionsArray.current[i * 3 + 2] = pos[2];
        }

        geometryRef.current.setAttribute(
            'position',
            new THREE.BufferAttribute(positionsArray.current.slice(0, positions.length * 3), 3)
        );
        geometryRef.current.setDrawRange(0, positions.length);
    });

    // Cleanup on unmount
    useEffect(() => {
        const geo = geometryRef.current;
        return () => {
            geo.dispose();
        };
    }, []);

    return (
        <line ref={lineRef}>
            <primitive object={geometryRef.current} attach="geometry" />
            <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={2} />
        </line>
    );
}

// ============================================
// DAMAGE DISPLAY - Fixed positioning
// ============================================
function DamageDisplay({ damage, position, playerName, color }) {
    const displayColor = useMemo(() => {
        if (damage < 50) return '#ffffff';
        if (damage < 100) return '#ffff00';
        if (damage < 150) return '#ff8800';
        return '#ff0000';
    }, [damage]);

    const scale = 1 + Math.min(damage / 200, 0.5);
    const shakeOffset = damage > 100 ? (Math.random() - 0.5) * 0.05 * (damage / 100) : 0;

    return (
        <Billboard position={[position[0] + shakeOffset, position[1] + 1.5, position[2]]}>
            {playerName && (
                <Text
                    fontSize={0.3}
                    color={color}
                    anchorY="bottom"
                    position={[0, 0.4, 0]}
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {playerName}
                </Text>
            )}
            <Text
                fontSize={0.5 * scale}
                color={displayColor}
                outlineWidth={0.04}
                outlineColor="#000000"
            >
                {Math.floor(damage)}%
            </Text>
        </Billboard>
    );
}

// ============================================
// GROUND SHADOW INDICATOR
// ============================================
function GroundIndicator({ position, color, radius, isAirborne }) {
    const opacity = isAirborne ? 0.15 : 0.35;
    const scale = isAirborne ? 0.6 : 1;

    return (
        <mesh
            position={[position[0], 0.02, position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[scale, scale, 1]}
        >
            <ringGeometry args={[radius * 0.9, radius * 1.1, 32]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
    );
}

// ============================================
// STOMP TARGET INDICATOR
// ============================================
function StompIndicator({ active, position }) {
    if (!active) return null;

    return (
        <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.6, 4]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.7} />
        </mesh>
    );
}

// ============================================
// SHIELD VISUAL EFFECT
// ============================================
function ShieldEffect({ position, radius }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime;
            meshRef.current.material.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[radius * 1.6, 32, 32]} />
            <meshBasicMaterial
                color="#00d4ff"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                wireframe
            />
        </mesh>
    );
}

// ============================================
// MAIN PUCK COMPONENT
// ============================================
export default function Puck({
    playerId,
    playerName,
    color,
    startPosition,
    isLocalPlayer = false,
    isBot = false,
    iconPath,
    tier = 1, // Add tier prop to determine shader
    powerup,
    damage = 0,
    onKnockout,
    onStomp,
    onPositionUpdate,
    onCollision,
    onUseItem,
    onImpact,
    onInvincibleChange, // NEW PROP
    isPaused,
    remotePosition,
    remoteVelocity,
    allPlayerPositions = {},
    gameMode = 'knockout',
    explosionEvent // NEW PROP
}) {
    const config = PHYSICS_CONFIG.puck;

    // ========== COMPUTED PHYSICS VALUES ==========
    const effectiveRadius = useMemo(() => {
        if (powerup?.id === 'giant') return config.radius * 1.8;
        if (powerup?.id === 'shrink') return config.radius * 0.6;
        return config.radius;
    }, [powerup?.id, config.radius]);

    const effectiveMass = useMemo(() => {
        let mass = config.mass;
        if (powerup?.id === 'giant') mass *= 2.5;
        if (powerup?.id === 'shrink') mass *= 0.5;
        if (powerup?.id === 'shield') mass *= 1.5;
        return mass;
    }, [powerup?.id, config.mass]);

    // Smash Bros knockback scaling
    const knockbackMultiplier = useMemo(() => {
        return 1 + (damage / 100) * PHYSICS_CONFIG.collision.damageMultiplier;
    }, [damage]);

    // ========== PHYSICS BODY ==========
    const [ref, api] = useSphere(() => ({
        mass: isLocalPlayer ? effectiveMass : 0,
        position: startPosition,
        args: [effectiveRadius],
        linearDamping: config.linearDamping,
        angularDamping: config.angularDamping,
        material: {
            restitution: config.restitution + (damage / 400), // More bouncy when damaged
            friction: powerup?.id === 'ghost' ? 0 : config.friction
        },
        userData: { playerId, type: 'puck' },
        onCollide: handlePhysicsCollision
    }));

    // ========== STATE ==========
    const velocity = useRef([0, 0, 0]);
    const position = useRef([...startPosition]);
    const trailPositions = useRef([]);
    const [isRespawning, setIsRespawning] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [isAirborne, setIsAirborne] = useState(false);
    const [stompTarget, setStompTarget] = useState(null);

    // Input state with debouncing - FIX for spacebar spam
    const inputState = useRef({
        keys: {},
        spacePressed: false, // Tracks if space was just pressed (for single-fire)
        spaceHeld: false,    // Tracks if space is being held
        jumpCooldown: 0,
        lastJumpTime: 0
    });

    // GAMEPAD SUPPORT
    const gamepad = useGamepad();
    const gamepadButtonState = useRef({
        jumpHeld: false,
        dashHeld: false,
        itemHeld: false
    });

    const [invincible, setInvincible] = useState(false);

    // Notify parent of invincibility state changes
    useEffect(() => {
        if (isLocalPlayer) {
            onInvincibleChange?.(invincible);
        }
    }, [invincible, isLocalPlayer, onInvincibleChange]);

    // ========== COLLISION HANDLER ==========
    const handlePhysicsCollision = useCallback((e) => {
        if (!isLocalPlayer || isPaused || invincible) return;

        const otherBody = e.body;
        const impactVelocity = e.contact?.impactVelocity || 0;
        const tileType = otherBody?.userData?.type;

        // Lava Hazard
        if (tileType === 'lava') {
            api.applyImpulse([0, 25, 0], [0, 0, 0]); // Big bounce out
            onCollision?.(30); // Heavy damage
            audio.playKnockout(); // Burn sound
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 200);
            return;
        }

        // Player-to-player collision
        if (otherBody?.userData?.type === 'puck' && impactVelocity > 2) {
            const knockbackForce = PHYSICS_CONFIG.collision.baseForce * knockbackMultiplier;
            const normal = new THREE.Vector3(
                e.contact.contactNormal[0],
                e.contact.contactNormal[1],
                e.contact.contactNormal[2]
            ).normalize();

            // Upward bias increases with damage (Smash Bros style)
            const upwardBias = Math.min(damage / 150, 0.6);

            api.applyImpulse([
                normal.x * knockbackForce,
                (Math.abs(normal.y) + upwardBias) * knockbackForce * 0.5,
                normal.z * knockbackForce
            ], [0, 0, 0]);

            onCollision?.(impactVelocity * knockbackMultiplier);
            audio.playImpact(impactVelocity / 10);

            // Heavy hit effects
            if (impactVelocity > 5) {
                onImpact?.(impactVelocity);
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 80);

                // Funny physics - random spin on big hits
                if (impactVelocity > 8 && Math.random() > 0.6) {
                    api.applyTorque([
                        (Math.random() - 0.5) * impactVelocity * 3,
                        (Math.random() - 0.5) * impactVelocity * 3,
                        (Math.random() - 0.5) * impactVelocity * 3
                    ]);
                }
            }
        }

        // Special tile interactions
        if (tileType === 'boost_pad') {
            const dir = otherBody.userData.direction || 0;
            api.applyImpulse([Math.sin(dir) * 20, 5, Math.cos(dir) * 20], [0, 0, 0]);
        } else if (tileType === 'spring') {
            api.applyImpulse([0, 35, 0], [0, 0, 0]);
            onImpact?.(5);
        }
    }, [isLocalPlayer, isPaused, invincible, knockbackMultiplier, damage, api, onCollision, onImpact]);

    // ========== SUBSCRIBE TO PHYSICS ==========
    useEffect(() => {
        const unsubVel = api.velocity.subscribe((v) => { velocity.current = v; });
        const unsubPos = api.position.subscribe((p) => {
            position.current = p;
            // Trail tracking
            trailPositions.current.push([...p]);
            if (trailPositions.current.length > 20) {
                trailPositions.current.shift();
            }
        });
        return () => { unsubVel(); unsubPos(); };
    }, [api]);

    // ========== INPUT HANDLING - Fixed debounce ==========
    const lastDashTime = useRef(0);

    // Dash Configuration
    const DASH_FORCE = 65;
    const DASH_COOLDOWN_MS = 2500;

    useEffect(() => {
        if (!isLocalPlayer) return;

        const handleKeyDown = (e) => {
            inputState.current.keys[e.code] = true;

            // Space key - single press detection (FIX: no more spam)
            if (e.code === 'Space' && !inputState.current.spaceHeld) {
                inputState.current.spacePressed = true;
                inputState.current.spaceHeld = true;
            }

            // Dash Input (Shift)
            if (e.shiftKey) {
                inputState.current.dashPressed = true;
            }
        };

        const handleKeyUp = (e) => {
            inputState.current.keys[e.code] = false;

            if (e.code === 'Space') {
                inputState.current.spaceHeld = false;
            }
            if (!e.shiftKey) {
                inputState.current.dashPressed = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isLocalPlayer]);

    // ========== MOVEMENT & AI LOOP (PHYSICS STEP) ==========
    useFrame(() => {
        if (isPaused || isRespawning) return;

        // --- LOCAL PLAYER INPUT ---
        if (isLocalPlayer) {
            const { keys, spacePressed, dashPressed } = inputState.current;
            let forceX = 0;
            let forceZ = 0;

            // GAMEPAD INPUT (via useGamepad hook)
            const gamepadInput = gamepad.poll();
            if (gamepad.connected) {
                forceX = gamepadInput.moveX;
                forceZ = gamepadInput.moveY; // Note: Y axis is inverted for "forward"

                // Gamepad buttons
                if (gamepadInput.jump && !gamepadButtonState.current.jumpHeld) {
                    inputState.current.spacePressed = true;
                    gamepadButtonState.current.jumpHeld = true;
                }
                if (!gamepadInput.jump) gamepadButtonState.current.jumpHeld = false;

                if (gamepadInput.dash && !gamepadButtonState.current.dashHeld) {
                    inputState.current.dashPressed = true;
                    gamepadButtonState.current.dashHeld = true;
                }
                if (!gamepadInput.dash) gamepadButtonState.current.dashHeld = false;

                if (gamepadInput.useItem && !gamepadButtonState.current.itemHeld) {
                    onUseItem?.();
                    gamepadButtonState.current.itemHeld = true;
                }
                if (!gamepadInput.useItem) gamepadButtonState.current.itemHeld = false;
            }

            // KEYBOARD: WASD / Arrow movement (merged with gamepad)
            if (keys['KeyW'] || keys['ArrowUp']) forceZ -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) forceZ += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) forceX -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) forceX += 1;

            // Normalize diagonal
            if (forceX !== 0 && forceZ !== 0) {
                const mag = Math.sqrt(forceX * forceX + forceZ * forceZ);
                forceX /= mag;
                forceZ /= mag;
            }

            // Apply powerup modifiers
            let accel = config.acceleration;
            if (powerup?.id === 'speed_boost') accel *= 1.8;
            if (powerup?.id === 'shrink') accel *= 1.3;
            if (powerup?.id === 'giant') accel *= 0.7;
            if (powerup?.id === 'cursed') { forceX *= -1; forceZ *= -1; }

            // Air control
            const isInAir = position.current[1] > 1;
            if (isInAir) accel *= (PHYSICS_CONFIG.puck.airControl || 0.7);

            if (forceX !== 0 || forceZ !== 0) {
                api.applyForce([forceX * accel, 0, forceZ * accel], [0, 0, 0]);
            }

            // DASH
            const now = Date.now();
            if (dashPressed && (now - lastDashTime.current > DASH_COOLDOWN_MS)) {
                let dashX = forceX;
                let dashZ = forceZ;
                if (dashX === 0 && dashZ === 0) dashZ = -1; // Default fwd
                api.applyImpulse([dashX * DASH_FORCE, 0, dashZ * DASH_FORCE], [0, 0, 0]);
                audio.playJump();
                onImpact?.(5);
                lastDashTime.current = now;
                inputState.current.dashPressed = false;
            }

            // JUMP / ITEM
            if (spacePressed) {
                inputState.current.spacePressed = false;
                if (powerup && powerup.type !== 'buff') {
                    onUseItem?.();
                } else if (now - inputState.current.lastJumpTime > 600) {
                    api.applyImpulse([0, 14, 0], [0, 0, 0]);
                    inputState.current.lastJumpTime = now;
                    audio.playJump();
                }
            }
        }

        // --- BOT AI LOGIC ---
        else if (isBot) {
            // Find target (closest player)
            let closestDist = Infinity;
            let targetPos = null;

            Object.entries(allPlayerPositions).forEach(([pid, pos]) => {
                if (pid === playerId) return; // Self
                const dist = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...position.current));
                if (dist < closestDist) {
                    closestDist = dist;
                    targetPos = pos;
                }
            });

            if (targetPos) {
                const dir = new THREE.Vector3(targetPos[0] - position.current[0], 0, targetPos[2] - position.current[2]).normalize();
                const aiForce = config.acceleration * 0.8; // Bots are slightly slower
                api.applyForce([dir.x * aiForce, 0, dir.z * aiForce], [0, 0, 0]);

                // Bot Jump randomly if stuck or near edge?
                if (Math.random() < 0.005) {
                    api.applyImpulse([0, 12, 0], [0, 0, 0]);
                }
            }
        }


    });

    // ========== EXPLOSION HANDLING ==========
    const lastExplosionTime = useRef(0);
    useEffect(() => {
        if (!explosionEvent || !isLocalPlayer || explosionEvent.timestamp <= lastExplosionTime.current) return;

        const { position: expPos, force } = explosionEvent;
        const myPos = position.current;
        const dist = new THREE.Vector3(myPos[0] - expPos[0], myPos[1] - expPos[1], myPos[2] - expPos[2]).length();

        if (dist < 30) { // Blast radius
            const dir = new THREE.Vector3(myPos[0] - expPos[0], myPos[1] - expPos[1] + 5, myPos[2] - expPos[2]).normalize();
            const power = force * (1 - dist / 30);
            api.applyImpulse([dir.x * power, dir.y * power, dir.z * power], [0, 0, 0]);
            audio.playImpact(10); // Reuse impact sound
            onImpact?.(20); // Massive shake
        }

        lastExplosionTime.current = explosionEvent.timestamp;
    }, [explosionEvent, isLocalPlayer, api, onImpact]);

    // ========== REMOTE PLAYER SYNC ==========
    useEffect(() => {
        if (!isLocalPlayer && remotePosition) {
            api.position.set(...remotePosition);
        }
        if (!isLocalPlayer && remoteVelocity) {
            api.velocity.set(...remoteVelocity);
        }
    }, [api, isLocalPlayer, remotePosition, remoteVelocity]);

    // ========== GAME LOGIC FRAME UPDATE ==========
    useFrame((state) => {
        if (isPaused) return;

        // Flash when invincible
        if (invincible && ref.current) {
            ref.current.visible = Math.floor(state.clock.elapsedTime * 10) % 2 === 0;
        } else if (ref.current && !isRespawning) {
            ref.current.visible = true; // Ensure visibility resets
        }

        // Track airborne state
        const currentlyAirborne = position.current[1] > 1;
        setIsAirborne(currentlyAirborne);

        // AIR STOMP DETECTION
        if (isLocalPlayer && currentlyAirborne && velocity.current[1] < -4 && !invincible) {
            // Check for players below
            Object.entries(allPlayerPositions).forEach(([id, pos]) => {
                if (id === playerId || !pos) return;

                if (canStomp(position.current, velocity.current, pos)) {
                    setStompTarget(id);

                    const stompDamage = calculateStompDamage(Math.abs(velocity.current[1]));
                    onStomp?.(id, { damage: stompDamage, knockback: Math.abs(velocity.current[1]) * 2 });

                    // Bounce up after stomp
                    api.velocity.set(
                        velocity.current[0] * 0.3,
                        Math.abs(velocity.current[1]) * 0.7,
                        velocity.current[2] * 0.3
                    );

                    setTimeout(() => setStompTarget(null), 200);
                }
            });
        }

        // Position update for local player
        if (isLocalPlayer) {
            onPositionUpdate?.(position.current, velocity.current);

            // Knockout check
            if (!isRespawning) {
                if (isInKnockoutZone(position.current)) {
                    handleKnockout();
                } else if (position.current[1] < -4) {
                    // Quick death for pits (Y < -4)
                    handleKnockout();
                }
            }
        }
    });

    // ========== KNOCKOUT HANDLER ==========
    const handleKnockout = useCallback(() => {
        setIsRespawning(true);
        onKnockout?.(playerId);
        audio.playKnockout();

        setTimeout(() => {
            api.position.set(...startPosition);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            trailPositions.current = [];
            setIsRespawning(false);

            // Invincibility phase
            setInvincible(true);
            setTimeout(() => setInvincible(false), 3000);
        }, 1500);
    }, [api, onKnockout, playerId, startPosition]);

    // ========== VISUAL STATE ==========
    const puckScale = powerup?.id === 'giant' ? 1.8 : powerup?.id === 'shrink' ? 0.6 : 1;
    const isInvisible = powerup?.id === 'invisible' && !isLocalPlayer;
    const isGhost = powerup?.id === 'ghost';
    const hasShield = powerup?.id === 'shield';

    // Speed check for trail
    const speed = Math.sqrt(
        velocity.current[0] ** 2 +
        velocity.current[1] ** 2 +
        velocity.current[2] ** 2
    );

    // Initialize shader ref
    const shaderRef = useRef();

    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.time = state.clock.elapsedTime;
        }
    });

    // Load Texture safely
    const iconTexture = useTexture(iconPath || '/images/logo.png');

    if (isInvisible) return null;

    // Determine Material Type
    const isDivine = tier === 10;
    const isCosmic = tier === 9;
    const isLegendary = tier >= 6 && tier < 9;
    const isMystery = iconPath && iconPath.includes('icon_150'); // Example logic for unique item

    // Final Puck Mesh Parts
    const bodyRadius = config.radius;
    const bodyHeight = 0.35;

    return (
        <group>
            {/* Damage display */}
            {!isRespawning && (
                <DamageDisplay
                    damage={damage}
                    position={position.current}
                    playerName={playerName}
                    color={color}
                />
            )}

            {/* Ground indicator */}
            <GroundIndicator
                position={position.current}
                color={color}
                radius={effectiveRadius}
                isAirborne={isAirborne}
            />

            {/* Stomp target indicator */}
            <StompIndicator
                active={!!stompTarget}
                position={position.current}
            />

            {/* Motion trail */}
            {!isRespawning && speed > 5 && (
                <PuckTrail
                    positionsRef={trailPositions}
                    color={color}
                    active={true}
                />
            )}

            {/* Shield effect */}
            {hasShield && !isRespawning && (
                <ShieldEffect
                    position={position.current}
                    radius={effectiveRadius}
                />
            )}

            {/* Main puck */}
            <group ref={ref} visible={!isRespawning} scale={[puckScale, puckScale, puckScale]}>
                {/* === HIGH-TECH PUCK MODEL === */}

                {/* 1. Inner Glowing Core (Visible through gaps) */}
                <mesh>
                    <cylinderGeometry args={[bodyRadius * 0.95, bodyRadius * 0.95, bodyHeight * 0.9, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                </mesh>

                {/* 2. Main Chassis (Dark Metal) */}
                <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[bodyRadius * 0.85, bodyRadius * 0.85, bodyHeight, 32]} />
                    <meshStandardMaterial
                        color={isFlashing ? "#ffffff" : "#111111"}
                        metalness={0.9}
                        roughness={0.2}
                        emissive={isFlashing ? "#ffffff" : "#000000"}
                    />
                </mesh>

                {/* 3. Segmented Armor Plates (6 Segments) */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <group key={i} rotation={[0, angle * Math.PI / 180, 0]}>
                        <mesh position={[0, 0, 0]}>
                            <cylinderGeometry
                                args={[bodyRadius + 0.02, bodyRadius + 0.02, bodyHeight * 0.85, 16, 1, false, -Math.PI / 6 + 0.1, Math.PI / 3 - 0.2]}
                            />
                            <meshStandardMaterial
                                color={isFlashing ? "#fff" : "#2a2a2a"}
                                metalness={0.8}
                                roughness={0.3}
                                envMapIntensity={1}
                            />
                        </mesh>
                        {/* Detail vents on plates */}
                        <mesh position={[bodyRadius + 0.015, 0, 0]} rotation={[0, -Math.PI / 6 + 0.1, 0]}>
                            <boxGeometry args={[0.05, bodyHeight * 0.5, 0.02]} />
                            <meshStandardMaterial color="#111" />
                        </mesh>
                    </group>
                ))}

                {/* 4. Top/Bottom Neon Rims (Circuit Lines) */}
                <mesh position={[0, bodyHeight / 2 - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[bodyRadius, 0.04, 16, 64]} />
                    <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>
                <mesh position={[0, -bodyHeight / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[bodyRadius, 0.04, 16, 64]} />
                    <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>

                {/* 5. Top Face - Armor Plate with Icon */}
                <group position={[0, bodyHeight / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    {/* Metal Frame Ring */}
                    <mesh>
                        <ringGeometry args={[bodyRadius * 0.85, bodyRadius * 1.1, 64]} />
                        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
                    </mesh>

                    {/* The Icon Surface */}
                    <mesh position={[0, 0, 0.01]}>
                        <circleGeometry args={[bodyRadius * 0.85, 32]} />
                        {isMystery ? (
                            <mysteryMaterial ref={shaderRef} map={iconTexture} transparent />
                        ) : isDivine ? (
                            <divineMaterial ref={shaderRef} map={iconTexture} transparent />
                        ) : isCosmic ? (
                            <cosmicMaterial ref={shaderRef} map={iconTexture} transparent />
                        ) : isLegendary ? (
                            <legendaryMaterial
                                ref={shaderRef}
                                map={iconTexture}
                                color={new THREE.Color(color)}
                                transparent
                            />
                        ) : (
                            <meshStandardMaterial
                                map={iconTexture}
                                transparent={isGhost}
                                opacity={isGhost ? 0.4 : 1}
                                metalness={0.5}
                                roughness={0.3}
                            />
                        )}
                    </mesh>

                    {/* Circuit Overlays on Top */}
                    <mesh position={[0, 0, 0.02]}>
                        <ringGeometry args={[bodyRadius * 0.8, bodyRadius * 0.82, 64]} />
                        <meshBasicMaterial color={color} transparent opacity={0.5} />
                    </mesh>
                </group>

                {/* 6. Bottom Detail */}
                <mesh position={[0, -bodyHeight / 2 - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[bodyRadius * 0.6, 32]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
                <mesh position={[0, -bodyHeight / 2 - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[bodyRadius * 0.6, bodyRadius * 0.9, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.2} />
                </mesh>
            </group>
        </group>
    );
}

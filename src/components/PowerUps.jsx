import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { PHYSICS_CONFIG, POWERUP_TYPES, distance3D } from '../utils/physics';
import { getPowerupInfo } from '../utils/powerups';

// Individual power-up component with distance-based pickup
export function PowerUp({ powerup, playerPositions, onCollect }) {
    const { type, position } = powerup;
    const meshRef = useRef();
    const glowRef = useRef();
    const collected = useRef(false);

    // Check distance to players every frame
    useFrame((state) => {
        const time = state.clock.elapsedTime;

        // Animate floating
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + Math.sin(time * 3) * 0.2;
        }

        if (glowRef.current) {
            glowRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.15);
            glowRef.current.material.opacity = 0.3 + Math.sin(time * 3) * 0.1;
        }

        // Distance-based pickup check
        if (!collected.current && playerPositions) {
            for (const [playerId, playerPos] of Object.entries(playerPositions)) {
                const dist = distance3D(position, playerPos);
                if (dist < PHYSICS_CONFIG.powerups.pickupRadius) {
                    collected.current = true;
                    onCollect(powerup.id, playerId);
                    break;
                }
            }
        }
    });

    if (collected.current) return null;

    // Get type data
    const info = getPowerupInfo(powerup.id) || POWERUP_TYPES[type.toUpperCase?.()] || type;
    const color = info.color || '#ffffff';
    const imagePath = info.imagePath || '/images/powerups/speed_boost.png';

    return (
        <group position={position}>
            {/* 3D Rotating Puck Powerup */}
            <group ref={meshRef}>
                <RotatingPuck texturePath={imagePath} color={color} />
            </group>

            {/* Glow Halo (kept as sphere for ambient effect) */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[PHYSICS_CONFIG.powerups.pickupRadius * 0.6, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} wireframe />
            </mesh>

            {/* Ground indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.05, 0]}>
                <circleGeometry args={[0.5, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

function RotatingPuck({ texturePath, color }) {
    const texture = useTexture(texturePath);
    const puckRef = useRef();

    useFrame((state) => {
        if (puckRef.current) {
            // Rotate the puck
            puckRef.current.rotation.y += 0.02;
            puckRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1; // Gentle tilt
        }
    });

    const bodyRadius = 0.5;
    const bodyHeight = 0.2;

    return (
        <group ref={puckRef}>
            {/* Dark Side/Bottom */}
            <mesh position={[0, -0.01, 0]}>
                <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 32]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Colored Rim */}
            <mesh>
                <cylinderGeometry args={[bodyRadius + 0.01, bodyRadius + 0.01, bodyHeight * 0.6, 32, 1, true]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} side={2} />
            </mesh>

            {/* Top Face with Icon */}
            <mesh position={[0, bodyHeight / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[bodyRadius * 0.85, 32]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    color={color} // Tint the icon slightly with powerup color
                    emissive={color}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Glass Cap */}
            <mesh position={[0, bodyHeight / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[bodyRadius, 32]} />
                <meshPhysicalMaterial
                    color="#fff"
                    transmission={0.5}
                    opacity={0.3}
                    transparent
                    roughness={0}
                    clearcoat={1}
                />
            </mesh>
        </group>
    );
}

// Container for all power-ups
export default function PowerUps({ powerups, playerPositions, onCollect }) {
    return (
        <group>
            {powerups.map((powerup) => (
                <PowerUp
                    key={powerup.id}
                    powerup={powerup}
                    playerPositions={playerPositions}
                    onCollect={onCollect}
                />
            ))}
        </group>
    );
}

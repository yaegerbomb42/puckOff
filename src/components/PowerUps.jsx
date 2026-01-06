import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, useTexture } from '@react-three/drei';
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
            {/* Visual power-up Icon */}
            <group ref={meshRef}>
                <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                    <PowerupIcon texturePath={imagePath} color={color} />
                </Billboard>
            </group>

            {/* Glow sphere */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.7, 16, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            {/* Ground indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.05, 0]}>
                <circleGeometry args={[0.6, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>

            {/* Pickup radius indicator */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.02, 0]}>
                <ringGeometry args={[PHYSICS_CONFIG.powerups.pickupRadius - 0.1, PHYSICS_CONFIG.powerups.pickupRadius, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
        </group>
    );
}

function PowerupIcon({ texturePath, color }) {
    const texture = useTexture(texturePath);
    return (
        <mesh>
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial map={texture} transparent alphaTest={0.5} emissive={color} emissiveIntensity={0.5} />
        </mesh>
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

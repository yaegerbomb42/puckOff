import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getPowerupInfo } from '../utils/powerups';

// Projectile Component
function Projectile({ id, type, position, velocity, ownerId, onHit, playerPositions }) {
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position,
        velocity,
        args: [0.3],
        userData: { id, type: 'projectile', ownerId },
        onCollide: (e) => {
            if (e.body.userData.playerId && e.body.userData.playerId !== ownerId) {
                onHit(id, e.body.userData.playerId, type);
            }
        }
    }));

    // Physics Logic
    useFrame(() => {
        if (!ref.current) return;

        // ROCKET: Homing
        if (type === 'rocket' && playerPositions) {
            // Find nearest enemy
            let nearestId = null;
            let minDst = Infinity;
            const myPos = ref.current.position; // Vector3

            Object.entries(playerPositions).forEach(([pid, pos]) => {
                if (pid === ownerId) return; // Don't target self
                const dst = myPos.distanceTo(new THREE.Vector3(...pos));
                if (dst < minDst) {
                    minDst = dst;
                    nearestId = pid;
                }
            });

            if (nearestId && minDst < 50) {
                const targetPos = new THREE.Vector3(...playerPositions[nearestId]);
                const dir = new THREE.Vector3().subVectors(targetPos, myPos).normalize();

                // Steer velocity
                const currentVel = new THREE.Vector3(); // we don't strictly have current vel unless we sub, allowing simple impulse for now
                api.applyForce([dir.x * 20, dir.y * 20, dir.z * 20], [0, 0, 0]);
            }
        }

        // SAW BLADE: Ground hugger + spin
        if (type === 'saw_blade') {
            api.applyForce([0, -10, 0], [0, 0, 0]); // Downforce
            ref.current.rotation.x += 0.2; // Visual spin
        }
    });

    const info = getPowerupInfo(type);
    const imagePath = info?.imagePath || '/images/powerups/rocket.png';
    const color = info?.color || 'white';

    return (
        <group ref={ref}>
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <ProjectileIcon texturePath={imagePath} color={color} />
            </Billboard>
        </group>
    );
}

function ProjectileIcon({ texturePath, color }) {
    const texture = useTexture(texturePath);
    return (
        <mesh>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial map={texture} transparent alphaTest={0.5} emissive={color} emissiveIntensity={0.8} />
        </mesh>
    );
}

export default function ProjectileSystem({ projectiles, onProjectileHit, playerPositions }) {
    return (
        <group>
            {projectiles.map(p => (
                <Projectile
                    key={p.id}
                    {...p}
                    onHit={onProjectileHit}
                    playerPositions={playerPositions}
                />
            ))}
        </group>
    );
}

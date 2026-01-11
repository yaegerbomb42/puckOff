import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getPowerupInfo } from '../utils/powerups';

// Projectile Component
function Projectile({ id, type, position, velocity, ownerId, onHit, playerPositions }) {
    const velocityRef = useRef([0, 0, 0]);
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position,
        velocity,
        args: [0.3],
        userData: { id, type: 'projectile', ownerId },
        onCollide: (e) => {
            if (e.body.userData.playerId && e.body.userData.playerId !== ownerId) {
                // Calculate impact speed
                const speed = Math.sqrt(
                    velocityRef.current[0] ** 2 +
                    velocityRef.current[1] ** 2 +
                    velocityRef.current[2] ** 2
                );
                onHit(id, e.body.userData.playerId, type, speed);
            }
        }
    }));

    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => (velocityRef.current = v));
        return unsubscribe;
    }, [api.velocity]);

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
                const desiredDir = new THREE.Vector3().subVectors(targetPos, myPos).normalize();

                // Current velocity vector
                const currentVel = new THREE.Vector3(...velocityRef.current);

                // Steer force: Desired velocity - Current velocity
                // We want to go towards target at max speed (e.g. 15)
                const maxSpeed = 15;
                const steering = desiredDir.multiplyScalar(maxSpeed).sub(currentVel);

                // Apply steering force (clamped)
                steering.clampLength(0, 0.5); // Max force

                api.applyForce([steering.x * 20, steering.y * 20, steering.z * 20], [0, 0, 0]);

                // Look at target
                ref.current.lookAt(targetPos);
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

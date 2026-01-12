import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Explosion particles that burst outward from a point.
 * Rendered using InstancedMesh for performance.
 */
export default function ExplosionParticles({ position, color = '#ff006e', count = 100, duration = 1.5 }) {
    const meshRef = useRef();
    const startTime = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate random initial velocities
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                Math.random() * 20 + 5,
                (Math.random() - 0.5) * 40
            ),
            scale: 0.3 + Math.random() * 0.7,
            rotationSpeed: (Math.random() - 0.5) * 10
        }));
    }, [count]);

    useEffect(() => {
        startTime.current = performance.now() / 1000;
    }, [position]);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        const elapsed = clock.elapsedTime - startTime.current;
        if (elapsed < 0) return; // Not started yet

        const progress = Math.min(elapsed / duration, 1);
        const alive = progress < 1;

        particles.forEach((p, i) => {
            if (!alive) {
                dummy.scale.set(0, 0, 0);
            } else {
                // Physics simulation
                const t = elapsed;
                const gravity = 9.8;

                dummy.position.set(
                    position[0] + p.velocity.x * t,
                    position[1] + p.velocity.y * t - 0.5 * gravity * t * t,
                    position[2] + p.velocity.z * t
                );

                // Fade out
                const fadeScale = p.scale * (1 - progress * 0.8);
                dummy.scale.set(fadeScale, fadeScale, fadeScale);

                // Spin
                dummy.rotation.x = t * p.rotationSpeed;
                dummy.rotation.y = t * p.rotationSpeed * 0.5;
            }

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                toneMapped={false}
            />
        </instancedMesh>
    );
}

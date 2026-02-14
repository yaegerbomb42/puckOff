import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * High-performance animated crowd using InstancedMesh.
 * Renders thousands of fans with a single draw call.
 */
export default function StadiumCrowd({ biome, count = 1500 }) {
    const meshRef = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate initial positions
    const particles = useMemo(() => {
        const temp = [];
        const colors = [
            new THREE.Color(biome?.colors?.accent || '#00d4ff'),
            new THREE.Color(biome?.colors?.hazard || '#ff006e'),
            new THREE.Color(biome?.colors?.glow || '#ffffff'),
            new THREE.Color('#ffffff')
        ];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 * 10; // Wrap around multiple times
            const radius = 65 + Math.random() * 30; // 65 to 95 radius
            const height = 15 + (radius - 65) * 1.5 + Math.random() * 5; // Stadium seating slope

            temp.push({
                position: [
                    Math.sin(angle) * radius,
                    height,
                    Math.cos(angle) * radius
                ],
                scale: 0.5 + Math.random() * 0.5,
                speed: 0.5 + Math.random(),
                phase: Math.random() * Math.PI * 2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
        return temp;
    }, [count, biome]);

    // Initialize Instance Colors
    useEffect(() => {
        if (!meshRef.current) return;

        particles.forEach((p, i) => {
            meshRef.current.setColorAt(i, p.color);
        });
        meshRef.current.instanceColor.needsUpdate = true;
    }, [particles]);

    // Animate "The Wave" / Excitement
    useFrame(({ clock }) => {
        if (!meshRef.current) return;

        const time = clock.elapsedTime;

        particles.forEach((p, i) => {
            // Bobbing animation
            const yOffset = Math.sin(time * p.speed * 5 + p.phase) * appliedExcitement;

            dummy.position.set(
                p.position[0],
                p.position[1] + yOffset,
                p.position[2]
            );

            // Look at center (0,0,0) roughly
            dummy.lookAt(0, 0, 0);

            // Scale pulse
            const s = p.scale + Math.sin(time * 10 + p.phase) * 0.1 * appliedExcitement;
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    // Determine excitement level (can be linked to game state later)
    const appliedExcitement = 1.0; // 0 = calm, 2.0 = crazy

    return (
        <instancedMesh
            ref={meshRef}
            args={[null, null, count]}
            frustumCulled={false}
            castShadow
            receiveShadow
        >
            <capsuleGeometry args={[0.3, 1, 4, 8]} /> {/* More organic "human" shape */}
            <meshStandardMaterial
                toneMapped={false}
                emissiveIntensity={0.5}
                roughness={0.8}
            />
        </instancedMesh>
    );
}

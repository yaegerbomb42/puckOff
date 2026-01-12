import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useTexture, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import { LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial } from '../../utils/PuckMaterials';

// Register shades
extend({ LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial });

function PreviewPuckModel({ icon }) {
    const meshRef = useRef();
    const texture = useTexture(icon?.imageUrl || '/images/logo.png');

    // Animate rotation
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 1.5;
            // Gentle bobbing
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    const tier = icon?.tier || 1;

    return (
        <mesh ref={meshRef} castShadow>
            <sphereGeometry args={[1.5, 64, 64]} />
            {/* Standard Tier (1-5) */}
            {tier <= 5 && (
                <meshStandardMaterial
                    map={texture}
                    metalness={0.4}
                    roughness={0.4}
                    color={tier === 1 ? '#ffffff' : '#eeeeee'}
                />
            )}

            {/* Legendary (6-7) - Holo effect from your code but slightly tweaked for Tier 7 too if desired */}
            {/* Reusing Legendary shader for 6 and 7 for now, or use Standard for 6 maybe? */}
            {tier >= 6 && tier < 8 && (
                <legendaryMaterial
                    map={texture}
                    time={0}
                    transparent
                />
            )}

            {/* Celestial (8) - Blue tint/Legendary variant? Or custom?
                For now using Legendary but maybe with specific color override if shader supported it, 
                or just reuse Cosmic for high end? 
                Actually economy.js says: 
                8: Celestial (Cosmic Horror) -> Mystery = true
            */}
            {/* If it's mystery but we can see it (owned), show cool shader */}

            {tier === 8 && (
                <legendaryMaterial
                    map={texture}
                    time={0}
                    color={new THREE.Color('#06b6d4')}
                />
            )}

            {tier === 9 && (
                <cosmicMaterial
                    map={texture}
                    time={0}
                />
            )}

            {tier === 10 && (
                <divineMaterial
                    map={texture}
                    time={0}
                />
            )}

            {/* Update time uniform for shaders */}
            <MaterialTimeUpdater />
        </mesh>
    );
}

function MaterialTimeUpdater() {
    useFrame((state) => {
        state.scene.traverse((child) => {
            if (child.material && child.material.uniforms && child.material.uniforms.time) {
                child.material.uniforms.time.value = state.clock.elapsedTime;
            }
        });
    });
    return null;
}

export default function PuckPreview({ icon, size = 300 }) {
    return (
        <div style={{ width: size, height: size, background: 'transparent' }}>
            <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                <Suspense fallback={null}>
                    <Center>
                        <PreviewPuckModel icon={icon} />
                    </Center>
                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
}

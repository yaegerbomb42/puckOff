import { useRef, Suspense } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useTexture, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import { LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial } from '../../utils/PuckMaterials';
import { TIERS } from '../../utils/economy';

// Register shades
extend({ LegendaryMaterial, CosmicMaterial, DivineMaterial, MysteryMaterial });

function PreviewPuckModel({ icon }) {
    const meshRef = useRef();

    // Only load texture for non-tier-0 icons
    const hasTexture = icon?.tier !== 0 && icon?.imageUrl;
    const texture = useTexture(hasTexture ? icon.imageUrl : '/images/logo.png');

    // Animate rotation
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 1.5;
            // Gentle bobbing
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    const tier = icon?.tier ?? 1;
    const color = icon?.color || (TIERS[tier]?.color) || '#ffffff';

    // Determine Material Type
    const isDivine = tier === 10;
    const isCosmic = tier === 9;
    const isLegendary = tier >= 6 && tier < 9;
    const isMystery = icon?.isMystery;

    const bodyRadius = 1.5; // Scaled up for preview
    const bodyHeight = 0.5;

    // Initialize shader ref
    const shaderRef = useRef();

    // Shader time update
    useFrame((state) => {
        if (shaderRef.current) {
            shaderRef.current.time = state.clock.elapsedTime;
        }
    });

    return (
        <group ref={meshRef}>
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
                    color="#111111"
                    metalness={0.9}
                    roughness={0.2}
                />
            </mesh>


            {/* 3. Segmented Armor Plates (6 Segments) - NOW WITH TEXTURE */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <group key={i} rotation={[0, angle * Math.PI / 180, 0]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry
                            args={[bodyRadius + 0.03, bodyRadius + 0.03, bodyHeight * 0.85, 16, 1, false, -Math.PI / 6 + 0.1, Math.PI / 3 - 0.2]}
                        />
                        {/* Use texture on sides if available, otherwise dark metal */}
                        <meshStandardMaterial
                            map={texture}
                            color={hasTexture ? '#ffffff' : '#2a2a2a'}
                            metalness={0.6}
                            roughness={0.4}
                        />
                    </mesh>
                    {/* Detail vents on plates */}
                    <mesh position={[bodyRadius + 0.025, 0, 0]} rotation={[0, -Math.PI / 6 + 0.1, 0]}>
                        <boxGeometry args={[0.08, bodyHeight * 0.5, 0.03]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                </group>
            ))}

            {/* 4. Top/Bottom Neon Rims (Circuit Lines) */}
            <mesh position={[0, bodyHeight / 2 - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[bodyRadius, 0.06, 16, 64]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh position={[0, -bodyHeight / 2 + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[bodyRadius, 0.06, 16, 64]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>

            {/* 5. Top Face - Armor Plate with Icon */}
            <group position={[0, bodyHeight / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                {/* Metal Frame Ring */}
                <mesh>
                    <ringGeometry args={[bodyRadius * 0.85, bodyRadius * 1.1, 64]} />
                    <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* The Icon Surface */}
                <mesh position={[0, 0, 0.01]}>
                    <circleGeometry args={[bodyRadius * 0.85, 32]} />
                    {isMystery ? (
                        <mysteryMaterial ref={shaderRef} map={texture} transparent />
                    ) : isDivine ? (
                        <divineMaterial ref={shaderRef} map={texture} transparent />
                    ) : isCosmic ? (
                        <cosmicMaterial ref={shaderRef} map={texture} transparent />
                    ) : isLegendary ? (
                        <legendaryMaterial
                            ref={shaderRef}
                            map={texture}
                            color={new THREE.Color(color)}
                            transparent
                        />
                    ) : (
                        <meshStandardMaterial
                            map={texture}
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

            {/* 6. Bottom Detail - NOW WITH TEXTURE */}
            <mesh position={[0, -bodyHeight / 2 - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[bodyRadius * 0.85, 32]} />
                {/* Apply texture to bottom too, maybe slightly darker */}
                <meshStandardMaterial
                    map={texture}
                    color="#bbbbbb"
                    metalness={0.5}
                    roughness={0.3}
                />
            </mesh>
            <mesh position={[0, -bodyHeight / 2 - 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[bodyRadius * 0.6, bodyRadius * 0.9, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>

            <MaterialTimeUpdater />
        </group>
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

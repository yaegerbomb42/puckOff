import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, useBox } from '@react-three/cannon';
import { Environment, OrbitControls, MeshTransmissionMaterial } from '@react-three/drei';
import { ZoinCoin } from './ZoinCoin';
import { useAuth } from '../../contexts/AuthContext';
import * as THREE from 'three';

// Glass Box Walls
function GlassBox({ size = 4 }) {
    const thickness = 0.5; // Thicker glass for premium look
    const wallMaterial = { friction: 0.1, restitution: 0.5 };

    // Invisible Physics Walls (to keep coins in)
    useBox(() => ({ position: [0, -size / 2 - thickness / 2, 0], args: [size, thickness, size], type: 'Static', material: wallMaterial }));
    useBox(() => ({ position: [0, size / 2 + thickness / 2, 0], args: [size, thickness, size], type: 'Static', material: wallMaterial }));
    useBox(() => ({ position: [-size / 2 - thickness / 2, 0, 0], args: [thickness, size, size], type: 'Static', material: wallMaterial }));
    useBox(() => ({ position: [size / 2 + thickness / 2, 0, 0], args: [thickness, size, size], type: 'Static', material: wallMaterial }));
    useBox(() => ({ position: [0, 0, -size / 2 - thickness / 2], args: [size, size, thickness], type: 'Static', material: wallMaterial }));
    useBox(() => ({ position: [0, 0, size / 2 + thickness / 2], args: [size, size, thickness], type: 'Static', material: wallMaterial }));

    return (
        <group>
            {/* Visual Glass Box - Premium Look */}
            <mesh>
                <boxGeometry args={[size, size, size]} />
                <MeshTransmissionMaterial
                    backside
                    thickness={0.5}
                    roughness={0}
                    transmission={1}
                    ior={1.5}
                    chromaticAberration={0.1}
                    anisotropy={0.1}
                    color="#ffffff"
                />
            </mesh>
            {/* Edges for definition */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(size, size, size)]} />
                <lineBasicMaterial color="white" opacity={0.2} transparent />
            </lineSegments>
        </group>
    );
}

export default function ZoinCube({ className, theme = 'STANDARD' }) {
    const { inventory } = useAuth();
    const [coins, setCoins] = useState([]);
    const prevZoins = React.useRef(inventory?.zoins || 0);
    const initialized = React.useRef(false);

    // Stable Coin Generation
    useEffect(() => {
        if (inventory?.zoins === undefined) return;

        const currentZoins = inventory.zoins;
        const diff = currentZoins - prevZoins.current;
        prevZoins.current = currentZoins;

        // If no change and we've already initialized, skip
        if (diff === 0 && initialized.current) return;

        initialized.current = true;

        setCoins(prev => {
            let nextCoins = [...prev];
            const MAX_COINS = 50; // Cap for performance

            // Calculate target counts
            // heavy = 1000, medium = 100, light = 10
            const getCounts = (amount) => {
                let rem = amount;
                const g = Math.floor(rem / 1000); rem %= 1000;
                const s = Math.floor(rem / 100); rem %= 100;
                const b = Math.ceil(rem / 10);
                return { g, s, b };
            };

            const target = getCounts(currentZoins);
            const current = {
                g: nextCoins.filter(c => c.type === (theme === 'HOLO' ? 'HOLO' : 'GOLD')).length,
                s: nextCoins.filter(c => c.type === (theme === 'HOLO' ? 'HOLO' : 'SILVER')).length,
                b: nextCoins.filter(c => c.type === (theme === 'HOLO' ? 'HOLO' : 'BRONZE')).length
            };

            // Helper to add coin
            const addCoin = (type) => {
                if (nextCoins.length >= MAX_COINS) return; // Hard cap
                nextCoins.push({
                    id: `${type}-${Date.now()}-${Math.random()}`, // Unique ID
                    type: type,
                    // Random spawn position at top
                    position: [(Math.random() - 0.5) * 2, 8 + Math.random() * 4, (Math.random() - 0.5) * 2]
                });
            };

            // Helper to remove coin
            const removeCoin = (type) => {
                const idx = nextCoins.findIndex(c => c.type === type);
                if (idx !== -1) nextCoins.splice(idx, 1);
            };

            // Adjust Gold
            const typeG = theme === 'HOLO' ? 'HOLO' : 'GOLD';
            const diffG = target.g - current.g;
            if (diffG > 0) for (let i = 0; i < diffG; i++) addCoin(typeG);
            else if (diffG < 0) for (let i = 0; i < Math.abs(diffG); i++) removeCoin(typeG);

            // Adjust Silver
            const typeS = theme === 'HOLO' ? 'HOLO' : 'SILVER';
            const diffS = target.s - current.s;
            if (diffS > 0) for (let i = 0; i < diffS; i++) addCoin(typeS);
            else if (diffS < 0) for (let i = 0; i < Math.abs(diffS); i++) removeCoin(typeS);

            // Adjust Bronze
            const typeB = theme === 'HOLO' ? 'HOLO' : 'BRONZE';
            const diffB = target.b - current.b;
            if (diffB > 0) for (let i = 0; i < diffB; i++) addCoin(typeB);
            else if (diffB < 0) for (let i = 0; i < Math.abs(diffB); i++) removeCoin(typeB);

            return nextCoins;
        });
    }, [inventory?.zoins, theme]);

    return (
        <div className={`zoin-cube-container ${className || ''}`}>
            <Canvas shadows camera={{ position: [6, 4, 8], fov: 40 }} gl={{ alpha: true, antialias: true }}>
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#00ff87" />

                <Suspense fallback={null}>
                    <Physics gravity={[0, -30, 0]} allowSleep step={1 / 60} iterations={10}>
                        <GlassBox size={4.5} />
                        {coins.map((coin, i) => (
                            <ZoinCoin
                                key={coin.id}
                                type={coin.type}
                                position={[
                                    (Math.random() - 0.5) * 2,
                                    Math.random() * 4 + 2, // Spawn higher
                                    (Math.random() - 0.5) * 2
                                ]}
                            />
                        ))}
                    </Physics>
                    <Environment preset="city" blur={1} />
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </Suspense>
            </Canvas>
        </div>
    );
}

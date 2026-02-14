import React from 'react';
import { useCylinder } from '@react-three/cannon';
import { useTexture } from '@react-three/drei';

export const COIN_TYPES = {
    GOLD: { value: 1000, color: '#ffd700', texture: '/images/zoins/gold.png', size: 0.8, metalness: 0.9, roughness: 0.3 },
    SILVER: { value: 100, color: '#c0c0c0', texture: '/images/zoins/silver.png', size: 0.7, metalness: 0.8, roughness: 0.4 },
    BRONZE: { value: 10, color: '#cd7f32', texture: '/images/zoins/bronze.png', size: 0.6, metalness: 0.7, roughness: 0.5 },
    HOLO: { value: 1000, color: '#00ffff', texture: '/images/zoins/holo.png', size: 0.8, metalness: 0.5, roughness: 0.2, emissive: '#00ffff', emissiveIntensity: 2 },
    GEM: { value: 1000, color: '#9d00ff', texture: '/images/zoins/gem.png', size: 0.8, metalness: 0.1, roughness: 0.1, transmission: 0.8 }
};

export function ZoinCoin({ type = 'GOLD', position }) {
    const config = COIN_TYPES[type];
    const texture = useTexture(config.texture);

    // Physics Body
    const [ref] = useCylinder(() => ({
        mass: 1,
        position,
        args: [config.size, config.size, 0.1, 16], // RadiusTop, RadiusBottom, Height, Segments
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        material: { friction: 0.3, restitution: 0.4 }
    }));

    return (
        <group ref={ref}>
            {/* Edge (Metal) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[config.size, config.size, 0.1, 32, 1, true]} />
                <meshStandardMaterial color={config.color} metalness={0.9} roughness={0.3} />
            </mesh>

            {/* Faces (Texture) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[config.size, 32]} />
                <meshStandardMaterial map={texture} metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[config.size, 32]} />
                <meshStandardMaterial map={texture} metalness={0.8} roughness={0.4} />
            </mesh>
        </group>
    );
}

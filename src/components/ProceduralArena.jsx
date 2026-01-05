import React, { useMemo } from 'react';
import { useBox, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { TILE_TYPES, gridToWorld } from '../utils/mapGenerator';

const TILE_SIZE = 3;
const TILE_HEIGHT = 0.5;

// Individual tile components
function FloorTile({ position, color }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position.x, -TILE_HEIGHT / 2, position.z],
        args: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
        material: { friction: 0.3, restitution: 0.5 }
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
        </mesh>
    );
}

function IceTile({ position, color }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position.x, -TILE_HEIGHT / 2, position.z],
        args: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE],
        material: { friction: 0.02, restitution: 0.8 } // Very slippery
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
            <meshStandardMaterial
                color={color || '#88ccff'}
                metalness={0.9}
                roughness={0.1}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

function LavaTile({ position, color }) {
    // Lava is a hazard - no physics body, just visual + damage zone
    return (
        <group position={[position.x, -TILE_HEIGHT / 2, position.z]}>
            <mesh receiveShadow>
                <boxGeometry args={[TILE_SIZE, TILE_HEIGHT * 0.5, TILE_SIZE]} />
                <meshStandardMaterial
                    color={color || '#ff4500'}
                    emissive={'#ff2200'}
                    emissiveIntensity={2}
                    metalness={0.5}
                    roughness={0.3}
                />
            </mesh>
            {/* Animated glow effect */}
            <pointLight
                color="#ff4500"
                intensity={1}
                distance={5}
                position={[0, 1, 0]}
            />
        </group>
    );
}

function RampTile({ position, rotation = 0 }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position.x, 0, position.z],
        rotation: [Math.PI / 6, rotation, 0], // 30-degree incline
        args: [TILE_SIZE, TILE_HEIGHT, TILE_SIZE * 1.2],
        material: { friction: 0.5, restitution: 0.3 }
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE * 1.2]} />
            <meshStandardMaterial color="#ffaa00" metalness={0.3} roughness={0.6} />
        </mesh>
    );
}

function BumperTile({ position, color }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position.x, TILE_HEIGHT, position.z],
        args: [TILE_SIZE * 0.6, TILE_HEIGHT * 2, TILE_SIZE * 0.6],
        material: { friction: 0.1, restitution: 2.0 } // Super bouncy
    }));

    return (
        <group>
            {/* Base floor */}
            <mesh position={[position.x, -TILE_HEIGHT / 2, position.z]} receiveShadow>
                <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
                <meshStandardMaterial color="#2a2a3a" metalness={0.1} roughness={0.8} />
            </mesh>
            {/* Bumper cylinder */}
            <mesh ref={ref} castShadow>
                <cylinderGeometry args={[TILE_SIZE * 0.3, TILE_SIZE * 0.35, TILE_HEIGHT * 2, 16]} />
                <meshStandardMaterial
                    color={color || '#ff00ff'}
                    emissive={color || '#ff00ff'}
                    emissiveIntensity={0.5}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
        </group>
    );
}

function WallTile({ position }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position.x, TILE_HEIGHT * 2, position.z],
        args: [TILE_SIZE, TILE_HEIGHT * 4, TILE_SIZE],
        material: { friction: 0.5, restitution: 0.3 }
    }));

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <boxGeometry args={[TILE_SIZE, TILE_HEIGHT * 4, TILE_SIZE]} />
            <meshStandardMaterial color="#333344" metalness={0.2} roughness={0.9} />
        </mesh>
    );
}

function SpawnTile({ position, color }) {
    return (
        <group position={[position.x, 0.01, position.z]}>
            {/* Floor base */}
            <mesh receiveShadow>
                <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
                <meshStandardMaterial color="#1a1a2a" metalness={0.1} roughness={0.8} />
            </mesh>
            {/* Spawn ring indicator */}
            <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.8, 1.2, 32]} />
                <meshStandardMaterial
                    color={color || '#00ff87'}
                    emissive={color || '#00ff87'}
                    emissiveIntensity={1}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

function PowerupZoneTile({ position }) {
    return (
        <group position={[position.x, 0.01, position.z]}>
            {/* Floor base */}
            <mesh receiveShadow>
                <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
                <meshStandardMaterial color="#2a1a3a" metalness={0.1} roughness={0.8} />
            </mesh>
            {/* Glowing platform */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[1, 1, 0.1, 32]} />
                <meshStandardMaterial
                    color="#ffff00"
                    emissive="#ffff00"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.7}
                />
            </mesh>
        </group>
    );
}

// Main ProceduralArena component
export default function ProceduralArena({ mapData }) {
    const tiles = useMemo(() => {
        if (!mapData || !mapData.grid) return [];

        const result = [];
        const { grid, gridSize, biome } = mapData;

        for (let z = 0; z < gridSize; z++) {
            for (let x = 0; x < gridSize; x++) {
                const tile = grid[z][x];
                const worldPos = gridToWorld(x, z, gridSize, TILE_SIZE);
                const key = `tile-${x}-${z}`;

                switch (tile.type) {
                    case TILE_TYPES.FLOOR:
                        result.push(<FloorTile key={key} position={worldPos} color={biome.colors.floor} />);
                        break;
                    case TILE_TYPES.ICE:
                        result.push(<IceTile key={key} position={worldPos} color={biome.colors.accent} />);
                        break;
                    case TILE_TYPES.LAVA:
                        result.push(<LavaTile key={key} position={worldPos} color={biome.colors.hazard} />);
                        break;
                    case TILE_TYPES.RAMP:
                        result.push(<RampTile key={key} position={worldPos} rotation={Math.random() * Math.PI * 2} />);
                        break;
                    case TILE_TYPES.BUMPER:
                        result.push(<BumperTile key={key} position={worldPos} color={biome.colors.accent} />);
                        break;
                    case TILE_TYPES.WALL:
                        result.push(<WallTile key={key} position={worldPos} />);
                        break;
                    case TILE_TYPES.SPAWN:
                        result.push(<SpawnTile key={key} position={worldPos} color={biome.colors.accent} />);
                        break;
                    case TILE_TYPES.POWERUP_ZONE:
                        result.push(<PowerupZoneTile key={key} position={worldPos} />);
                        break;
                    default:
                        result.push(<FloorTile key={key} position={worldPos} color={biome.colors.floor} />);
                }
            }
        }

        return result;
    }, [mapData]);

    if (!mapData) {
        return null;
    }

    return (
        <group>
            {/* Biome name indicator could go here */}
            {tiles}

            {/* Ambient arena lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={0.8}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
        </group>
    );
}

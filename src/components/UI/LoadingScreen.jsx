import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Html } from '@react-three/drei';

function SpinningBox() {
    const mesh = useRef();
    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta * 0.5;
            mesh.current.rotation.y += delta * 1;
        }
    });

    return (
        <mesh ref={mesh}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
            <meshBasicMaterial color="#00d4ff" wireframe />
        </mesh>
    );
}

export default function LoadingScreen() {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 9999 }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <Center>
                    <SpinningBox />
                </Center>
                <Html center>
                    <div style={{
                        color: '#00d4ff',
                        fontFamily: 'Orbitron',
                        marginTop: '100px',
                        letterSpacing: '4px',
                        textShadow: '0 0 10px #00d4ff'
                    }}>
                        LOADING
                    </div>
                </Html>
            </Canvas>
        </div>
    );
}

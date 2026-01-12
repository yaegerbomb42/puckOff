import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, DepthOfField, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';

export default function PostProcessing({ impactIntensity = 0 }) {
    const chromaRef = useRef();
    const currentOffset = useRef(new THREE.Vector2(0.002, 0.002)); // Base offset

    // Animate chromatic aberration on impact
    useFrame((state, delta) => {
        if (!chromaRef.current) return;

        // Base offset
        const baseOffset = 0.002;
        // Impact spike (decays quickly)
        const spikeTarget = impactIntensity * 0.02; // Max 0.02 offset displacement

        // Lerp current offset towards target (with decay)
        const targetX = baseOffset + spikeTarget;
        const targetY = baseOffset + spikeTarget;

        currentOffset.current.x += (targetX - currentOffset.current.x) * 0.1;
        currentOffset.current.y += (targetY - currentOffset.current.y) * 0.1;

        // Apply to effect
        chromaRef.current.offset.set(currentOffset.current.x, currentOffset.current.y);
    });

    return (
        <EffectComposer>
            {/* Bloom for glowing effects - Tuned for Neon Punch */}
            <Bloom
                intensity={1.5}
                luminanceThreshold={0.85}
                luminanceSmoothing={0.1}
                mipmapBlur
            />

            {/* Dynamic Chromatic Aberration - spikes on impacts */}
            <ChromaticAberration
                ref={chromaRef}
                offset={[0.002, 0.002]}
                radialModulation={false}
                modulationOffset={0}
            />

            {/* Vignette for focus effect */}
            <Vignette
                offset={0.5}
                darkness={0.6}
            />

            {/* Film Grain for texture */}
            <Noise opacity={0.025} />

            {/* Subtle Depth of Field for cinematic feel */}
            <DepthOfField
                focusDistance={0.02}
                focalLength={0.5}
                bokehScale={2}
            />

            {/* Color Grading - Boost saturation for neon pop */}
            <HueSaturation
                hue={0}
                saturation={0.15} // Subtle saturation boost
            />
        </EffectComposer>
    );
}

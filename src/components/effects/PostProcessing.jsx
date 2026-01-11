import React from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function PostProcessing() {
    return (
        <EffectComposer>
            {/* Bloom for glowing effects - Tuned for Neon Punch */}
            < Bloom
                intensity={1.5}
                luminanceThreshold={0.85} // Only very bright things glow
                luminanceSmoothing={0.1}
                mipmapBlur // Better quality blur
            />

            {/* Subtle chromatic aberration for premium feel */}
            < ChromaticAberration
                offset={[0.002, 0.002]} // Slightly stronger
                radialModulation={false}
                modulationOffset={0}
            />

            {/* Vignette for focus effect */}
            < Vignette
                offset={0.5}
                darkness={0.6}
            />

            {/* Film Grain for texture */}
            < Noise opacity={0.025} />
        </EffectComposer >
    );
}

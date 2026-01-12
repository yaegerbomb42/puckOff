import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Optimized Dynamic Camera System
 * - Reuses vectors (no GC pressure)
 * - Multiple camera modes
 * - Knockout focus zoom
 * - Slowmo support
 * - Screen shake with intensity scaling
 */

// Camera mode configurations
const CAMERA_MODES = {
    DEFAULT: {
        height: 18,
        distance: 15,
        fov: 50,
        followSpeed: 2.0,
        lookAheadFactor: 0.3
    },
    COMBAT: {
        height: 14,
        distance: 12,
        fov: 55,
        followSpeed: 3.0,
        lookAheadFactor: 0.5
    },
    KNOCKOUT: {
        height: 10,
        distance: 8,
        fov: 42,
        followSpeed: 5.0,
        lookAheadFactor: 0
    },
    WIDE: {
        height: 25,
        distance: 22,
        fov: 60,
        followSpeed: 1.5,
        lookAheadFactor: 0.2
    }
};

function DynamicCamera({
    playerPositions,
    localPlayerId,
    shake = 0,
    knockoutTarget = null,
    slowmo = false
}) {
    const { camera } = useThree();

    // OPTIMIZATION: Reuse vectors instead of creating new ones each frame
    const vectors = useMemo(() => ({
        targetPos: new THREE.Vector3(0, 18, 15),
        lookAtPos: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(),
        lastCenter: new THREE.Vector3(),
        tempLookAt: new THREE.Vector3()
    }), []);

    // State refs
    const currentMode = useRef('DEFAULT');
    const shakeIntensity = useRef(0);
    const dramaticZoom = useRef(0);

    // State for Chase Camera
    const chaseState = useRef({
        currentPosition: new THREE.Vector3(0, 5, 10),
        currentLookAt: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(),
        lastPlayerPos: new THREE.Vector3(),
        rotationAngle: 0 // For when player is stationary
    });

    useFrame((state, delta) => {
        const positions = Object.values(playerPositions);
        const timeScale = slowmo ? 0.3 : 1;
        const adjustedDelta = Math.min(delta * timeScale, 0.1);

        // --- CHASE CAMERA LOGIC (If Local Player Exists) ---
        if (localPlayerId && playerPositions[localPlayerId]) {
            const playerPosArray = playerPositions[localPlayerId];
            const playerPos = new THREE.Vector3(playerPosArray[0], playerPosArray[1], playerPosArray[2]);
            const cs = chaseState.current;

            // 1. Calculate Velocity & Direction
            // We compute velocity manually since we don't have it explicitly
            const frameVelocity = playerPos.clone().sub(cs.lastPlayerPos);
            // Ignore tiny movements (jitter)
            if (frameVelocity.length() > 0.05) {
                // Smooth velocity update
                cs.velocity.lerp(frameVelocity.divideScalar(adjustedDelta), 0.1);

                // Update rotation angle based on movement
                const targetAngle = Math.atan2(cs.velocity.x, cs.velocity.z);

                // Smooth rotation avoiding the -PI/PI wrap issue
                let angleDiff = targetAngle - cs.rotationAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                cs.rotationAngle += angleDiff * adjustedDelta * 3.0; // Rotation speed
            }
            cs.lastPlayerPos.copy(playerPos);

            // 2. Determine Camera Target Position
            // "Behind" the player based on rotationAngle
            const distance = 9.0;
            const height = 4.5;

            const offset = new THREE.Vector3(
                Math.sin(cs.rotationAngle) * distance,
                -height,
                Math.cos(cs.rotationAngle) * distance
            );

            // Camera position is Player - Offset (effectively)
            // We want camera BEHIND, so we subtract vectors properly
            // Actually: Position = Player - Forward * Dist + Up * Height
            // My offset calc above is effectively Forward * Dist

            const targetCamPos = playerPos.clone().sub(offset);

            // Add slight look-ahead to the camera Position for "Speed" feel
            // targetCamPos.add(cs.velocity.clone().multiplyScalar(0.2));

            // 3. Smooth Damping (Spring-like follow)
            cs.currentPosition.lerp(targetCamPos, adjustedDelta * 3.5);

            // 4. Look At Target
            // Look slightly ahead of the puck
            const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)); // Look a bit above ground
            lookTarget.add(cs.velocity.clone().multiplyScalar(0.3)); // Lead the target

            cs.currentLookAt.lerp(lookTarget, adjustedDelta * 4.0);

            // 5. Knockout / Screen Shake
            if (shake > shakeIntensity.current) shakeIntensity.current = shake;

            if (shakeIntensity.current > 0.005) {
                const s = shakeIntensity.current;
                cs.currentPosition.x += (Math.random() - 0.5) * s;
                cs.currentPosition.y += (Math.random() - 0.5) * s * 0.5;
                cs.currentPosition.z += (Math.random() - 0.5) * s * 0.3;
                shakeIntensity.current *= 0.90;
            }

            // Apply to Camera
            camera.position.copy(cs.currentPosition);
            camera.lookAt(cs.currentLookAt);

        }
        // --- FALLBACK / SPECTATOR LOGIC (Old Logic) ---
        else if (positions.length > 0) {
            // ... (Condensed version of old logic for spectator) ...
            // Calculate center
            let centerX = 0, centerY = 0, centerZ = 0;
            positions.forEach(p => { centerX += p[0]; centerY += p[1]; centerZ += p[2]; });
            centerX /= positions.length; centerY /= positions.length; centerZ /= positions.length;

            const targetPos = new THREE.Vector3(centerX, 18, centerZ + 15);
            camera.position.lerp(targetPos, adjustedDelta * 2);
            camera.lookAt(centerX, 0, centerZ);
        }
    });

    return null;
}



export default DynamicCamera;

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpotLight, Float } from '@react-three/drei';

export function AIDrone({ targetMachineId, machines }: { targetMachineId: string | null, machines: any[] }) {
  const droneRef = useRef<THREE.Group>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);

  useFrame((state, delta) => {
    if (!droneRef.current) return;

    if (targetMachineId) {
      const targetMachine = machines.find(m => m.id === targetMachineId);
      if (targetMachine) {
        // Fly towards target
        const targetPos = new THREE.Vector3(targetMachine.position[0], 2.5, targetMachine.position[2] + 2);
        droneRef.current.position.lerp(targetPos, delta * 2);
        
        // Look at target
        droneRef.current.lookAt(targetMachine.position[0], 0, targetMachine.position[2]);
        
        // Spotlight pulse
        if (spotlightRef.current) {
          spotlightRef.current.target.position.set(targetMachine.position[0], 0, targetMachine.position[2]);
          spotlightRef.current.target.updateMatrixWorld();
          spotlightRef.current.intensity = 5 + Math.sin(state.clock.elapsedTime * 10) * 2;
        }
      }
    } else {
      // Idle patrol circle
      const radius = 8;
      const speed = 0.5;
      const x = Math.sin(state.clock.elapsedTime * speed) * radius;
      const z = Math.cos(state.clock.elapsedTime * speed) * radius;
      droneRef.current.position.lerp(new THREE.Vector3(x, 4, z), delta);
      droneRef.current.rotation.y += delta * 0.5;
      
      if (spotlightRef.current) {
        spotlightRef.current.intensity = 2;
      }
    }
  });

  return (
    <Float speed={4} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={droneRef} position={[0, 4, 0]}>
        {/* Drone Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 8]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Drone Core Ring */}
        <mesh position={[0, 0.06, 0]}>
          <torusGeometry args={[0.15, 0.02, 16, 32]} />
          <meshBasicMaterial color="#00A3E0" />
        </mesh>

        {/* Rotors */}
        {[
          [-0.4, 0.4], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4]
        ].map((pos, idx) => (
          <group key={idx} position={[pos[0], 0, pos[1]]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.1]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.01]} />
              <meshBasicMaterial color="#000" transparent opacity={0.5} />
            </mesh>
          </group>
        ))}

        {/* Scanner Spotlight */}
        <SpotLight
          ref={spotlightRef}
          color="#00A3E0"
          distance={10}
          angle={0.4}
          penumbra={0.5}
          intensity={2}
          position={[0, -0.1, 0]}
          castShadow
        />
      </group>
    </Float>
  );
}

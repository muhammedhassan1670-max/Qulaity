import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function FPSController() {
  const { camera } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Velocity and direction
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const speed = 10.0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Set initial FPS height
    camera.position.y = 1.7;
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera]);

  useFrame((_state, delta) => {
    // Basic WASD Movement
    const frontVector = new THREE.Vector3(
      0,
      0,
      (keys.current['KeyS'] ? 1 : 0) - (keys.current['KeyW'] ? 1 : 0)
    );
    const sideVector = new THREE.Vector3(
      (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0),
      0,
      0
    );

    direction.current
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed * delta);

    // Apply movement relative to camera rotation
    // Note: camera.rotation is modified by PointerLockControls
    velocity.current.copy(direction.current).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    
    // Move camera
    camera.position.add(velocity.current);

    // Pseudo-collision (Don't fall through floor, don't fly)
    camera.position.y = 1.7;

    // Simple boundary collision
    if (camera.position.x > 25) camera.position.x = 25;
    if (camera.position.x < -25) camera.position.x = -25;
    if (camera.position.z > 25) camera.position.z = 25;
    if (camera.position.z < -25) camera.position.z = -25;
  });

  return null;
}

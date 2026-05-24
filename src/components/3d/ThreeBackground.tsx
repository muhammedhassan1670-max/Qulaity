import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  mode?: 'full' | 'lite' | '2d';
  interactive?: boolean;
}

export function ThreeBackground({ mode = 'full', interactive = false }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const particlesRef = useRef<THREE.Points | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const objectsRef = useRef<THREE.Group>(new THREE.Group());

  const initThreeJS = useCallback(() => {
    if (!containerRef.current || mode === '2d') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;
    camera.position.y = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: mode === 'full',
      alpha: true,
      powerPreference: mode === 'lite' ? 'low-power' : 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mode === 'lite' ? 1 : 2));
    renderer.setClearColor(0x0a0a0f, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create industrial particles
    createParticles(scene);
    
    // Create industrial grid
    createGrid(scene);
    
    // Create floating geometric shapes
    createGeometricShapes(scene);
    
    // Create light effects
    createLights(scene);

    // Start animation loop
    animate();

    // Event listeners
    window.addEventListener('resize', handleResize);
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('scroll', handleScroll);
    }
  }, [mode, interactive]);

  const createParticles = (scene: THREE.Scene) => {
    const particleCount = mode === 'lite' ? 500 : 1500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(0x0066CC);
    const color2 = new THREE.Color(0x00A3E0);
    const color3 = new THREE.Color(0xFF6B35);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Position
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 60;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      // Color
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.6) {
        color = color1;
      } else if (colorChoice < 0.9) {
        color = color2;
      } else {
        color = color3;
      }
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Size
      sizes[i] = Math.random() * 2 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);
  };

  const createGrid = (scene: THREE.Scene) => {
    const gridSize = 100;
    const gridDivisions = 50;
    
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x0066CC, 0x16213e);
    gridHelper.position.y = -10;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridRef.current = gridHelper;
    scene.add(gridHelper);

    // Secondary grid (higher up)
    const gridHelper2 = new THREE.GridHelper(gridSize, gridDivisions, 0x00A3E0, 0x1a1a2e);
    gridHelper2.position.y = 20;
    gridHelper2.material.opacity = 0.15;
    gridHelper2.material.transparent = true;
    scene.add(gridHelper2);
  };

  const createGeometricShapes = (scene: THREE.Scene) => {
    const group = objectsRef.current;
    
    // Create industrial cubes
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0066CC,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });

    for (let i = 0; i < 8; i++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30
      );
      cube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      cube.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2
      };
      group.add(cube);
    }

    // Create octahedrons
    const octaGeometry = new THREE.OctahedronGeometry(1.5);
    const octaMaterial = new THREE.MeshPhongMaterial({
      color: 0x00A3E0,
      transparent: true,
      opacity: 0.4,
      wireframe: true
    });

    for (let i = 0; i < 6; i++) {
      const octa = new THREE.Mesh(octaGeometry, octaMaterial);
      octa.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 25
      );
      octa.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.015,
          y: (Math.random() - 0.5) * 0.015,
          z: (Math.random() - 0.5) * 0.015
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2
      };
      group.add(octa);
    }

    // Create torus rings
    const torusGeometry = new THREE.TorusGeometry(3, 0.3, 8, 30);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF6B35,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });

    for (let i = 0; i < 4; i++) {
      const torus = new THREE.Mesh(torusGeometry, torusMaterial);
      torus.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );
      torus.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      torus.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: Math.random() * 0.5 + 0.5,
        floatOffset: Math.random() * Math.PI * 2
      };
      group.add(torus);
    }

    scene.add(group);
  };

  const createLights = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Point lights with industrial colors
    const light1 = new THREE.PointLight(0x0066CC, 1, 50);
    light1.position.set(20, 20, 20);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x00A3E0, 1, 50);
    light2.position.set(-20, 10, 10);
    scene.add(light2);

    const light3 = new THREE.PointLight(0xFF6B35, 0.8, 40);
    light3.position.set(0, -10, 15);
    scene.add(light3);

    // Directional light for depth
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(0, 50, 0);
    scene.add(dirLight);
  };

  const animate = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const time = Date.now() * 0.001;
    const scrollProgress = scrollRef.current;

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.05;
      particlesRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
      
      // Scroll-based particle movement
      particlesRef.current.position.y = scrollProgress * -10;
    }

    // Animate grid
    if (gridRef.current) {
      gridRef.current.position.z = Math.sin(time * 0.2) * 2;
    }

    // Animate geometric shapes
    objectsRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.userData.rotationSpeed) {
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        mesh.rotation.z += mesh.userData.rotationSpeed.z;
        
        // Floating animation
        mesh.position.y += Math.sin(time * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.01;
      }
    });

    // Camera parallax based on mouse
    if (interactive && cameraRef.current) {
      const targetX = mouseRef.current.x * 2;
      const targetY = mouseRef.current.y * 2 + 5;
      cameraRef.current.position.x += (targetX - cameraRef.current.position.x) * 0.05;
      cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.05;
      cameraRef.current.lookAt(0, 0, 0);
    }

    // Scroll-based camera movement
    if (cameraRef.current) {
      cameraRef.current.position.z = 30 - scrollProgress * 5;
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    frameIdRef.current = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    if (!cameraRef.current || !rendererRef.current) return;
    
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  };

  const handleMouseMove = (event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const handleScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  };

  const cleanup = () => {
    cancelAnimationFrame(frameIdRef.current);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current && rendererRef.current.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    }
    
    // Dispose geometries and materials
    objectsRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
  };

  useEffect(() => {
    initThreeJS();
    return cleanup;
  }, [initThreeJS]);

  if (mode === '2d') return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-100]"
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    />
  );
}

export default ThreeBackground;

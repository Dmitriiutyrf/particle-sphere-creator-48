import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 2000;
const COMET_COUNT = 3;

const createStarTexture = (): THREE.Texture => {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.6)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

// Distant planet as a simple sphere with glow
const DistantPlanet = ({
  position,
  color,
  size,
  speed,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
}) => {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * speed;
    // Subtle floating motion
    ref.current.position.y = position[1] + Math.sin(t * speed * 0.5) * 0.3;
    if (glowRef.current) {
      glowRef.current.position.copy(ref.current.position);
    }
  });

  return (
    <group>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[size * 1.3, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

// Comet with trail
const Comet = ({ seed }: { seed: number }) => {
  const ref = useRef<THREE.Group>(null!);
  const trailRef = useRef<THREE.Points>(null!);

  const trailPositions = useMemo(() => new Float32Array(30 * 3), []);
  const trailSizes = useMemo(() => {
    const sizes = new Float32Array(30);
    for (let i = 0; i < 30; i++) {
      sizes[i] = (1 - i / 30) * 0.08;
    }
    return sizes;
  }, []);

  const texture = useMemo(() => createStarTexture(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.15 + seed * 100;
    const cycle = (t % 40) / 40; // 0-1 cycle
    
    // Comet flies across the scene
    const x = -20 + cycle * 40;
    const y = 8 + Math.sin(seed * 5) * 6 + Math.sin(cycle * Math.PI) * 3;
    const z = -15 + Math.sin(seed * 3) * 10;

    ref.current.position.set(x, y, z);

    // Update trail
    const arr = trailRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 29; i > 0; i--) {
      arr[i * 3] = arr[(i - 1) * 3];
      arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
      arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
    }
    arr[0] = x;
    arr[1] = y;
    arr[2] = z;
    trailRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#aaccff" transparent opacity={0.15} />
      </mesh>
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={30} array={trailPositions} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={30} array={trailSizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          size={0.1}
          transparent
          opacity={0.6}
          color="#aaddff"
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// Asteroid belt ring
const AsteroidRing = () => {
  const ref = useRef<THREE.Points>(null!);
  const count = 300;
  const texture = useMemo(() => createStarTexture(), []);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 12 + (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 0.5;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.02;
    ref.current.rotation.x = 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.08}
        transparent
        opacity={0.4}
        color="#887766"
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Starfield
const Starfield = () => {
  const ref = useRef<THREE.Points>(null!);
  const texture = useMemo(() => createStarTexture(), []);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const color = new THREE.Color();

    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 15 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Warm and cool star colors
      const temp = Math.random();
      if (temp < 0.3) color.setHSL(0.6, 0.3, 0.7 + Math.random() * 0.3); // blue
      else if (temp < 0.6) color.setHSL(0.15, 0.4, 0.8 + Math.random() * 0.2); // warm
      else color.setHSL(0, 0, 0.8 + Math.random() * 0.2); // white

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = 0.03 + Math.random() * 0.08;
    }
    return { positions, colors, sizes };
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.005;
    // Twinkle
    const sArr = ref.current.geometry.attributes.size.array as Float32Array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < STAR_COUNT; i++) {
      sArr[i] = sizes[i] * (0.7 + Math.sin(t * 2 + i * 0.5) * 0.3);
    }
    ref.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={STAR_COUNT} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={STAR_COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const CosmicBackground = () => {
  return (
    <group>
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4488ff" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#ff6644" />
      
      <Starfield />
      <AsteroidRing />

      {/* Distant planets */}
      <DistantPlanet position={[-9, 4, -18]} color="#cc5544" size={1.2} speed={0.08} />
      <DistantPlanet position={[12, -3, -22]} color="#4466aa" size={0.8} speed={0.05} />
      <DistantPlanet position={[6, 7, -25]} color="#88aa55" size={1.5} speed={0.03} />
      <DistantPlanet position={[-14, -6, -20]} color="#aa77cc" size={0.6} speed={0.12} />

      {/* Comets */}
      {Array.from({ length: COMET_COUNT }, (_, i) => (
        <Comet key={i} seed={i} />
      ))}
    </group>
  );
};

export default CosmicBackground;

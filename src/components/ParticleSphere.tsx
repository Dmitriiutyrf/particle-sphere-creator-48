import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 5000;

// Simple 3D noise using sin combinations
const noise3D = (x: number, y: number, z: number, t: number): number => {
  return (
    Math.sin(x * 1.2 + t * 0.8) * Math.cos(y * 1.1 + t * 0.6) * 0.5 +
    Math.sin(y * 1.5 + t * 0.7) * Math.cos(z * 1.3 + t * 0.9) * 0.4 +
    Math.sin(z * 1.1 + t * 1.1) * Math.cos(x * 1.4 + t * 0.5) * 0.3 +
    Math.sin(x * 2.3 + y * 1.8 + t * 1.3) * 0.2 +
    Math.sin(z * 2.1 + x * 1.6 + t * 0.4) * Math.cos(y * 2.4 + t * 0.8) * 0.15
  );
};

const ParticleSphere = () => {
  const points = useRef<THREE.Points>(null!);

  const { basePositions, colors, baseSizes } = useMemo(() => {
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const baseSizes = new Float32Array(PARTICLE_COUNT);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2;

      basePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      basePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      basePositions[i * 3 + 2] = r * Math.cos(phi);

      // Aqua-cyan-blue liquid palette
      const hue = 0.52 + Math.random() * 0.12;
      const sat = 0.7 + Math.random() * 0.3;
      const light = 0.45 + Math.random() * 0.35;
      color.setHSL(hue, sat, light);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      baseSizes[i] = 0.015 + Math.random() * 0.025;
    }

    return { basePositions, colors, baseSizes };
  }, []);

  const posArray = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const sizeArray = useMemo(() => new Float32Array(PARTICLE_COUNT), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slow organic rotation
    points.current.rotation.y = t * 0.08;
    points.current.rotation.x = Math.sin(t * 0.05) * 0.15;

    const posAttr = points.current.geometry.attributes.position;
    const sizeAttr = points.current.geometry.attributes.size;
    const pArr = posAttr.array as Float32Array;
    const sArr = sizeAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];

      // Normalize to get direction
      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      const nx = bx / len;
      const ny = by / len;
      const nz = bz / len;

      // Multiple layers of noise for liquid-like deformation
      const deform1 = noise3D(nx * 2, ny * 2, nz * 2, t * 0.6) * 0.35;
      const deform2 = noise3D(nx * 4, ny * 4, nz * 4, t * 0.9) * 0.12;
      const deform3 = noise3D(nx * 1.2, ny * 1.2, nz * 1.2, t * 0.3) * 0.2;

      // Breathing pulse
      const breath = Math.sin(t * 0.8 + i * 0.0003) * 0.08;

      // Drip effect - particles occasionally stretch downward
      const dripPhase = Math.sin(t * 0.4 + nx * 3 + nz * 2);
      const drip = ny < -0.3 ? Math.max(0, dripPhase) * 0.15 * Math.abs(ny) : 0;

      const totalDeform = deform1 + deform2 + deform3 + breath;
      const r = len + totalDeform;

      pArr[i3] = nx * r;
      pArr[i3 + 1] = ny * r - drip;
      pArr[i3 + 2] = nz * r;

      // Size pulsation for liquid shimmer
      const sizePulse = 1 + Math.sin(t * 3 + i * 0.02) * 0.3 + deform1 * 0.5;
      sArr[i] = baseSizes[i] * Math.max(0.3, sizePulse);
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={basePositions.slice()}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={baseSizes.slice()}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleSphere;

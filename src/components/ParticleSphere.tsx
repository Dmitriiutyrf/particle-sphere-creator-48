import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const noise3D = (x: number, y: number, z: number, t: number): number => {
  return (
    Math.sin(x * 1.2 + t * 0.8) * Math.cos(y * 1.1 + t * 0.6) * 0.5 +
    Math.sin(y * 1.5 + t * 0.7) * Math.cos(z * 1.3 + t * 0.9) * 0.4 +
    Math.sin(z * 1.1 + t * 1.1) * Math.cos(x * 1.4 + t * 0.5) * 0.3 +
    Math.sin(x * 2.3 + y * 1.8 + t * 1.3) * 0.2 +
    Math.sin(z * 2.1 + x * 1.6 + t * 0.4) * Math.cos(y * 2.4 + t * 0.8) * 0.15
  );
};

const createParticleTexture = (): THREE.Texture => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

interface ParticleSphereProps {
  isMobile?: boolean;
}

const ParticleSphere = ({ isMobile = false }: ParticleSphereProps) => {
  const PARTICLE_COUNT = isMobile ? 3000 : 6000;
  const points = useRef<THREE.Points>(null!);
  const texture = useMemo(() => createParticleTexture(), []);

  const { basePositions, colors, baseSizes, layers } = useMemo(() => {
    const total = PARTICLE_COUNT;
    const basePositions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const baseSizes = new Float32Array(total);
    const layers = new Float32Array(total);
    const color = new THREE.Color();

    for (let i = 0; i < total; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      let r: number;
      let layer: number;

      if (i < total * 0.2) {
        r = Math.random() * 1.2;
        layer = 0;
      } else if (i < total * 0.85) {
        r = 1.8 + (Math.random() - 0.5) * 0.4;
        layer = 1;
      } else {
        r = 2.2 + Math.random() * 0.8;
        layer = 2;
      }

      basePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      basePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      basePositions[i * 3 + 2] = r * Math.cos(phi);

      const hue = 0.55 + Math.random() * 0.1;
      const sat = layer === 0 ? 0.9 : 0.7 + Math.random() * 0.3;
      const light = layer === 0 ? 0.7 : layer === 2 ? 0.3 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3;
      color.setHSL(hue, sat, light);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      baseSizes[i] = layer === 0 ? 0.04 + Math.random() * 0.03 : layer === 2 ? 0.01 + Math.random() * 0.015 : 0.02 + Math.random() * 0.025;
      layers[i] = layer;
    }

    return { basePositions, colors, baseSizes, layers };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PARTICLE_COUNT]);

  // On mobile, update every other frame for performance
  const frameCounter = useRef(0);

  useFrame(({ clock }) => {
    frameCounter.current++;
    if (isMobile && frameCounter.current % 2 !== 0) return;

    const t = clock.getElapsedTime();

    points.current.rotation.y = t * 0.06;
    points.current.rotation.x = Math.sin(t * 0.04) * 0.12;

    const posAttr = points.current.geometry.attributes.position;
    const sizeAttr = points.current.geometry.attributes.size;
    const colorAttr = points.current.geometry.attributes.color;
    const pArr = posAttr.array as Float32Array;
    const sArr = sizeAttr.array as Float32Array;
    const cArr = colorAttr.array as Float32Array;

    const color = new THREE.Color();
    const baseHue = (t * 0.035) % 1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];
      const layer = layers[i];

      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      const nx = bx / len;
      const ny = by / len;
      const nz = bz / len;

      const intensity = layer === 0 ? 0.6 : layer === 2 ? 1.5 : 1;
      const speed = layer === 0 ? 0.4 : layer === 2 ? 0.8 : 0.6;

      const deform1 = noise3D(nx * 2, ny * 2, nz * 2, t * speed) * 0.35 * intensity;
      const deform2 = noise3D(nx * 4, ny * 4, nz * 4, t * speed * 1.5) * 0.12 * intensity;
      const deform3 = noise3D(nx * 1.2, ny * 1.2, nz * 1.2, t * speed * 0.5) * 0.2 * intensity;
      const breath = Math.sin(t * 0.7 + i * 0.0003) * 0.1;

      const dripPhase = Math.sin(t * 0.35 + nx * 3 + nz * 2);
      const drip = ny < -0.3 && layer === 1 ? Math.max(0, dripPhase) * 0.2 * Math.abs(ny) : 0;

      const totalDeform = deform1 + deform2 + deform3 + breath;
      const r = len + totalDeform;

      pArr[i3] = nx * r;
      pArr[i3 + 1] = ny * r - drip;
      pArr[i3 + 2] = nz * r;

      const hueNoise = noise3D(nx * 1.5, ny * 1.5, nz * 1.5, t * 0.12) * 0.18;
      const hue = (baseHue + hueNoise + layer * 0.05 + i * 0.00003) % 1;
      const sat = 0.7 + Math.sin(t * 0.4 + i * 0.001) * 0.2;
      const light = layer === 0
        ? 0.6 + Math.sin(t * 1.5 + i * 0.01) * 0.2
        : layer === 2
          ? 0.3 + Math.sin(t * 0.8 + i * 0.005) * 0.15
          : 0.45 + deform1 * 0.3 + Math.sin(t * 2 + i * 0.005) * 0.1;

      color.setHSL(hue, Math.min(1, Math.max(0.4, sat)), Math.min(0.85, Math.max(0.2, light)));
      cArr[i3] = color.r;
      cArr[i3 + 1] = color.g;
      cArr[i3 + 2] = color.b;

      const sizePulse = 1 + Math.sin(t * 2.5 + i * 0.015) * 0.35 + deform1 * 0.4;
      sArr[i] = baseSizes[i] * Math.max(0.3, sizePulse);
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={basePositions.slice()} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors.slice()} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={baseSizes.slice()} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={isMobile ? 0.08 : 0.06}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  );
};

export default ParticleSphere;

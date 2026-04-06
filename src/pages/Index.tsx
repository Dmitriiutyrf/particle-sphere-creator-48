import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import ParticleSphere from "@/components/ParticleSphere";

const Index = () => {
  return (
    <div className="w-full h-screen bg-background">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 55 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={["#050510"]} />
        <ParticleSphere />
        <EffectComposer>
          <Bloom
            intensity={1.8}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.3} dampingFactor={0.05} />
      </Canvas>
    </div>
  );
};

export default Index;

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import ParticleSphere from "@/components/ParticleSphere";
import CosmicBackground from "@/components/CosmicBackground";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="w-full h-screen bg-background touch-none">
      <Canvas
        camera={{ position: [0, 0, isMobile ? 7 : 5.5], fov: isMobile ? 60 : 55 }}
        gl={{ antialias: !isMobile, alpha: false, powerPreference: "high-performance" }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <color attach="background" args={["#020208"]} />
        <CosmicBackground />
        <ParticleSphere isMobile={isMobile} />
        <EffectComposer>
          <Bloom
            intensity={isMobile ? 1.2 : 1.8}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
        <OrbitControls
          enableZoom={!isMobile}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
          touches={{ ONE: 1, TWO: 2 }}
        />
      </Canvas>
    </div>
  );
};

export default Index;

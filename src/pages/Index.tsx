import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import ParticleSphere from "@/components/ParticleSphere";

const Index = () => {
  return (
    <div className="w-full h-screen bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <ParticleSphere />
        <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default Index;

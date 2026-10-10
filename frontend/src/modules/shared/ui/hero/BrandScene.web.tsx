import { brand } from '@manabandhu/design-system';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Rounded-square tile shape in mark units (1 unit = 1024 px of the SVG artboard). */
function roundedSquare(size: number, radius: number) {
  const h = size / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-h + radius, -h);
  shape.lineTo(h - radius, -h);
  shape.quadraticCurveTo(h, -h, h, -h + radius);
  shape.lineTo(h, h - radius);
  shape.quadraticCurveTo(h, h, h - radius, h);
  shape.lineTo(-h + radius, h);
  shape.quadraticCurveTo(-h, h, -h, h - radius);
  shape.lineTo(-h, -h + radius);
  shape.quadraticCurveTo(-h, -h, -h + radius, -h);
  return shape;
}

/** One arch of the "M": a half torus plus two legs, matching the SVG mark proportions. */
function Arch({ x }: { x: number }) {
  const radius = 0.23;
  const tube = 0.047;
  const legLength = 0.44;
  return (
    <group position={[x, -0.02, 0.09]}>
      <mesh>
        <torusGeometry args={[radius, tube, 24, 64, Math.PI]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.35}
          metalness={0}
          roughness={0.3}
        />
      </mesh>
      {[-radius, radius].map((legX) => (
        <mesh key={legX} position={[legX, -legLength / 2, 0]}>
          <cylinderGeometry args={[tube, tube, legLength, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.35}
            metalness={0}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mark() {
  const group = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const tileGeometry = useMemo(() => {
    const geometry = new THREE.ExtrudeGeometry(roundedSquare(1, 0.23), {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 6,
      curveSegments: 24,
    });
    geometry.translate(0, 0, -0.06);
    return geometry;
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      // Follow the pointer a little, and keep a slow idle sway.
      group.current.rotation.y +=
        (pointer.x * 0.5 + Math.sin(t * 0.6) * 0.25 - group.current.rotation.y) * 0.06;
      group.current.rotation.x +=
        (-pointer.y * 0.35 + Math.cos(t * 0.5) * 0.08 - group.current.rotation.x) * 0.06;
      group.current.position.y = Math.sin(t * 1.2) * 0.04;
    }
    if (dot.current) dot.current.position.y = 0.26 + Math.abs(Math.sin(t * 2)) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={tileGeometry}>
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.15}
          color={brand.color.primary}
          roughness={0.35}
        />
      </mesh>
      <Arch x={-0.23} />
      <Arch x={0.23} />
      <mesh position={[0, 0.26, 0.12]} ref={dot}>
        <sphereGeometry args={[0.065, 32, 32]} />
        <meshStandardMaterial
          color={brand.color.accent}
          emissive={brand.color.accent}
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

/** Small spheres orbiting the mark: the members and modules around one community. */
function Orbit() {
  const group = useRef<THREE.Group>(null);
  const colors = [
    brand.color.teal,
    brand.color.accent,
    brand.color.primaryLight,
    '#ffffff',
    brand.color.teal,
  ];
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.25;
  });
  return (
    <group ref={group} rotation={[1.1, 0, 0]}>
      {colors.map((color, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        return (
          <mesh
            key={`${color}-${angle}`}
            position={[Math.cos(angle) * 0.95, Math.sin(angle) * 0.95, 0]}
          >
            <sphereGeometry args={[0.055 + (i % 2) * 0.02, 24, 24]} />
            <meshStandardMaterial color={color} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function BrandScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.6], fov: 45 }}
      dpr={[1, 2]}
      flat
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight color="#ffffff" groundColor={brand.color.primaryDeep} intensity={0.8} />
      <directionalLight intensity={2.2} position={[2, 3, 4]} />
      <pointLight color={brand.color.accent} intensity={2} position={[-2, -1, 2]} />
      {/* Soft halo behind the tile. */}
      <mesh position={[0, 0, -0.4]}>
        <circleGeometry args={[0.95, 64]} />
        <meshBasicMaterial color="#ffffff" opacity={0.12} transparent />
      </mesh>
      <Mark />
      <Orbit />
    </Canvas>
  );
}

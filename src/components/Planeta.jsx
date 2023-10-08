import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Box3, Vector3, Float32BufferAttribute, Points, PointsMaterial, BufferGeometry, BoxHelper } from "three";
import { OrbitControls, CameraControls } from "@react-three/drei";
import { Physics, usePlane, useBox, useSphere } from "@react-three/cannon";
import { useRef, useEffect, useState, useContext, createContext } from "react";
import "../styles/Game2D.css";

function Planet({ modelPath, mass, size, position }) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const box = new Box3().setFromObject(gltf.scene);
  const radius = box.max.distanceTo(box.min) / 2;
  const scale = size / radius;
  gltf.scene.scale.set(scale, scale, scale);
  gltf.scene.position.set(position[0], radius * scale + position[1], position[2]);
  const [ref, api] = useSphere(() => ({ mass: mass, position: position, args: [radius * scale] }));
  return (
    <Canvas>
      <primitive object={gltf.scene} ref={ref} />
    </Canvas>
  );
}

export { Planet };

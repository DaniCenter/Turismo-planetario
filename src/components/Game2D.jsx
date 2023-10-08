import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  Box3,
  Vector3,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  BufferGeometry,
  BoxHelper,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  SphereGeometry,
} from "three";
import { OrbitControls, CameraControls } from "@react-three/drei";
import { Physics, usePlane, useBox, useSphere } from "@react-three/cannon";
import { useRef, useEffect, useState, useContext, createContext } from "react";
import "../styles/Game2D.css";

function useKeyboardControls() {
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "KeyW") {
        setMovement((movement) => ({ ...movement, forward: true }));
      } else if (event.code === "KeyS") {
        setMovement((movement) => ({ ...movement, backward: true }));
      } else if (event.code === "KeyA") {
        setMovement((movement) => ({ ...movement, left: true }));
      } else if (event.code === "KeyD") {
        setMovement((movement) => ({ ...movement, right: true }));
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === "KeyW") {
        setMovement((movement) => ({ ...movement, forward: false }));
      } else if (event.code === "KeyS") {
        setMovement((movement) => ({ ...movement, backward: false }));
      } else if (event.code === "KeyA") {
        setMovement((movement) => ({ ...movement, left: false }));
      } else if (event.code === "KeyD") {
        setMovement((movement) => ({ ...movement, right: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return movement;
}

function Planet({ modelPath, mass, size, position, boxSize }) {
  const gltf = useLoader(GLTFLoader, modelPath);
  const model = gltf.scene.clone(); // Clona el modelo
  const radioActual = model.position.set(position[0], position[1], position[2]);
  // Calcula la esfera de colisión del planeta
  const { scene } = useThree();
  const geometry = new SphereGeometry(boxSize, 32, 32);
  const material = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const collisionSphereMesh = new Mesh(geometry, material);
  collisionSphereMesh.position.set(position[0], position[1], position[2]);
  scene.add(collisionSphereMesh);
  console.log(model.scale);
  model.scale.set(size, size, size);
  const [ref, api] = useSphere(() => ({
    mass: mass,
    position: [position[0], position[1], position[2]],
    args: [boxSize],
  }));

  return <primitive object={model} ref={ref} />;
}

function Rocket() {
  const gltf = useLoader(GLTFLoader, "/models/Rocket2.glb");
  gltf.scene.scale.set(0.5, 0.5, 0.5);
  const box = new Box3().setFromObject(gltf.scene);
  const height = box.max.y - box.min.y;
  const [ref, api] = useBox(() => ({ mass: 1000, position: [0, height / 2, 0] }));
  const keyboardControls = useKeyboardControls();
  const currentDirection = useRef(new Vector3(0, 0, -1));
  const totalRotation = useRef(0);
  const { camera, scene } = useThree();

  // // Calcula la caja de colisión del cohete
  // const size = box.getSize(new Vector3());
  // const geometry = new BoxGeometry(size.x, size.y, size.z);
  // const material = new MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  // const collisionBoxMesh = new Mesh(geometry, material);
  // collisionBoxMesh.position.copy(box.getCenter(new Vector3()));
  // scene.add(collisionBoxMesh);

  camera.far = 2000;
  camera.updateProjectionMatrix();
  useFrame((state, delta) => {
    let velocity = new Vector3(0, 0, 0);
    if (keyboardControls.forward) {
      velocity.add(currentDirection.current.clone().multiplyScalar(100));
      if (keyboardControls.left) {
        totalRotation.current += Math.PI / 45;
        currentDirection.current.applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 45);
        gltf.scene.rotation.y += Math.PI / 45;
      } else if (keyboardControls.right) {
        totalRotation.current -= Math.PI / 45;
        currentDirection.current.applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 45);
        gltf.scene.rotation.y -= Math.PI / 45;
      }
    }

    api.velocity.set(velocity.x, velocity.y, velocity.z);
    if (keyboardControls.forward) {
      api.rotation.copy(ref.current.rotation);
    }
    api.position.subscribe((state) => {
      const cameraOffset = new Vector3(0, 70, 100);
      cameraOffset.applyAxisAngle(new Vector3(0, 1, 0), totalRotation.current);
      camera.position.x = state[0] + cameraOffset.x;
      camera.position.y = state[1] + cameraOffset.y;
      camera.position.z = state[2] + cameraOffset.z;
      camera.lookAt(state[0], state[1], state[2]);
    });
  });
  return <primitive object={gltf.scene} ref={ref} />;
}

function InvisibleFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
  }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry attach="geometry" args={[100, 100]} />
      <meshPhongMaterial attach="material" transparent opacity={0} />
    </mesh>
  );
}

function Stars() {
  const { scene } = useThree();
  const ref = useRef();
  useEffect(() => {
    const starGeometry = new BufferGeometry();
    const starMaterial = new PointsMaterial({
      color: 0xbbbbbb,
      size: 0.7,
    });
    const starVertices = [];
    for (let i = 0; i < 50000; i++) {
      const x = (Math.random() - 0.5) * 10000;
      const y = (Math.random() - 0.5) * 900;
      const z = (Math.random() - 0.5) * 10000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute("position", new Float32BufferAttribute(starVertices, 3));
    const stars = new Points(starGeometry, starMaterial);
    ref.current = stars;
    scene.add(stars);
    return () => {
      scene.remove(stars);
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, [scene]);

  return null;
}

export default function Game2D() {
  return (
    <div id="canvas">
      <Canvas style={{ background: "black" }}>
        <ambientLight intensity={1} />
        <Stars />
        <Physics>
          <Planet modelPath="/models/tierra.glb" mass={0} size={120} position={[500, 0, 0]} boxSize={270} />
          <Rocket />
          <InvisibleFloor />
        </Physics>
      </Canvas>
    </div>
  );
}

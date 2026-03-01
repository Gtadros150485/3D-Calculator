import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { RotateCcw } from "lucide-react";

export default function Viewer3D({ modelFile }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!modelFile || modelFile.status !== "done") return;
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.3);
    dirLight2.position.set(-100, -50, -100);
    scene.add(dirLight2);

    // Grid
    const grid = new THREE.GridHelper(200, 20, 0xe2e8f0, 0xe2e8f0);
    grid.position.y = -50;
    scene.add(grid);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Load model
    const fileUrl = `/uploads/${modelFile.filename}`;
    const format = modelFile.file_format.toLowerCase();
    const material = new THREE.MeshPhongMaterial({
      color: 0x4a9eff,
      specular: 0x333333,
      shininess: 40,
    });

    const onLoad = (geometry) => {
      let mesh;
      if (geometry.isBufferGeometry) {
        geometry.computeVertexNormals();
        mesh = new THREE.Mesh(geometry, material);
      } else {
        // OBJ returns a Group
        geometry.traverse((child) => {
          if (child.isMesh) child.material = material;
        });
        mesh = geometry;
      }

      // Center the model
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      mesh.position.sub(center);

      // Fit camera
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(maxDim * 1.5, maxDim * 1.0, maxDim * 1.5);
      camera.near = maxDim / 100;
      camera.far = maxDim * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();

      scene.add(mesh);
      setLoaded(true);
    };

    const onError = (err) => {
      console.error("Model load error:", err);
      setError("Failed to load model for preview");
    };

    if (format === "stl") {
      const loader = new STLLoader();
      loader.load(fileUrl, onLoad, undefined, onError);
    } else if (format === "obj") {
      const loader = new OBJLoader();
      loader.load(fileUrl, onLoad, undefined, onError);
    } else {
      setError(`3MF preview not supported in browser. Dimensions shown above are accurate.`);
    }

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [modelFile]);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!modelFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <div className="text-4xl">📦</div>
        <p className="text-sm">No model uploaded</p>
      </div>
    );
  }

  if (modelFile.status === "pending" || modelFile.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <div className="text-4xl animate-pulse">⚙️</div>
        <p className="text-sm font-medium text-blue-600">Processing model...</p>
        <p className="text-xs text-gray-400">This may take a few seconds</p>
      </div>
    );
  }

  if (modelFile.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm">Analysis failed</p>
        <p className="text-xs text-gray-400">{modelFile.error_message}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-4 text-center">
          <div className="text-3xl">📐</div>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <div ref={mountRef} className="w-full h-full" />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-sm text-gray-400 animate-pulse">Loading model...</div>
            </div>
          )}
          <button
            onClick={resetCamera}
            className="absolute top-3 right-3 bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:bg-gray-50 transition-colors"
            title="Reset view"
          >
            <RotateCcw size={14} className="text-gray-500" />
          </button>
        </>
      )}
    </div>
  );
}

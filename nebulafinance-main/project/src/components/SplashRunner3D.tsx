import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// Real rigged 3D human (three.js official "Soldier" model — Idle/Run/Walk clips).
// Source: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/Soldier.glb (MIT-licensed repo)
useGLTF.preload('/models/Soldier.glb');

// ── Timeline (seconds) — mirrors the DOM/CSS beats in SplashScreen.tsx ──────
const DRAW_BEGIN = 0.35;
const DRAW_DUR = 2.8;
const RUN_BEGIN = 0.5;
const RUN_DUR = 2.7;
const CATCH_AT = 3.08;
const CAMERA_SETTLE = 3.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

// The same rising, gently-waving curve as the old SVG STOCK_PATH, expressed as
// SVG-space waypoints (0–1000 x, 0–600 y) so the shape stays visually identical.
const SVG_WAYPOINTS: [number, number][] = [
  [40, 520], [140, 512], [180, 505], [250, 470], [340, 430],
  [420, 395], [480, 360], [560, 310], [640, 265], [700, 215], [790, 150],
];

function toWorld([x, y]: [number, number], i: number, len: number): THREE.Vector3 {
  const t = i / (len - 1);
  const wx = ((x - 415) / 1000) * 14;
  const wy = ((520 - y) / 370) * 4.3 - 1.4;
  const wz = -t * 4.2;
  return new THREE.Vector3(wx, wy, wz);
}

const CURVE_POINTS = SVG_WAYPOINTS.map((p, i) => toWorld(p, i, SVG_WAYPOINTS.length));
const PATH_CURVE = new THREE.CatmullRomCurve3(CURVE_POINTS, false, 'catmullrom', 0.25);
const CATCH_POINT = PATH_CURVE.getPointAt(1);

const LINE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const LINE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform float uProgress;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  void main() {
    if (vUv.x > uProgress) discard;
    float head = smoothstep(uProgress - 0.05, uProgress, vUv.x);
    vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vUv.x));
    color += head * 0.9;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function Clock({
  drawRef,
  runRef,
  elapsedRef,
}: {
  drawRef: React.MutableRefObject<number>;
  runRef: React.MutableRefObject<number>;
  elapsedRef: React.MutableRefObject<number>;
}) {
  const t0 = useRef(-1);
  useFrame(({ clock }) => {
    if (t0.current < 0) t0.current = clock.getElapsedTime();
    const e = clock.getElapsedTime() - t0.current;
    elapsedRef.current = e;
    drawRef.current = easeInOutCubic(clamp01((e - DRAW_BEGIN) / DRAW_DUR));
    runRef.current = easeInOutCubic(clamp01((e - RUN_BEGIN) / RUN_DUR));
  });
  return null;
}

function CameraRig({ elapsedRef }: { elapsedRef: React.MutableRefObject<number> }) {
  useFrame(({ camera }) => {
    const e = clamp01(elapsedRef.current / CAMERA_SETTLE);
    const ease = easeInOutCubic(e);
    camera.position.x = THREE.MathUtils.lerp(1.7, 0.25, ease);
    camera.position.y = THREE.MathUtils.lerp(2.7, 1.35, ease);
    camera.position.z = THREE.MathUtils.lerp(8.8, 7.8, ease);
    camera.lookAt(0, 0.5, -1.6);
  });
  return null;
}

function HeroLine({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const geometry = useMemo(() => new THREE.TubeGeometry(PATH_CURVE, 220, 0.05, 12, false), []);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uColorA: { value: new THREE.Color('#6366F1') },
      uColorB: { value: new THREE.Color('#34D399') },
    }),
    []
  );
  useFrame(() => {
    matRef.current.uniforms.uProgress.value = progressRef.current;
  });
  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={LINE_VERTEX}
        fragmentShader={LINE_FRAGMENT}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}

function TipGlow({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    const t = clamp01(progressRef.current);
    group.current.position.copy(PATH_CURVE.getPointAt(t === 0 ? 0.0001 : t));
    ring.current.rotation.z += delta * 2.4;
    const visible = t > 0.001 && t < 0.999;
    group.current.visible = visible;
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color="#34D399" toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[0.17, 0.012, 8, 32]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CatchFlare({ elapsedRef }: { elapsedRef: React.MutableRefObject<number> }) {
  const core = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const e = clamp01(elapsedRef.current - CATCH_AT);
    const dur = 0.55;
    const p = clamp01(e / dur);
    const pop = p < 0.4 ? p / 0.4 : 1 - (p - 0.4) / 0.6;
    core.current.scale.setScalar(0.4 + pop * 2.6);
    (core.current.material as THREE.MeshBasicMaterial).opacity = e > 0 ? Math.max(0, 1 - p * 1.4) : 0;
    ring.current.scale.setScalar(0.3 + p * 4.5);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = e > 0 ? Math.max(0, 0.8 - p) : 0;
  });
  return (
    <group position={CATCH_POINT}>
      <mesh ref={core}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[0.14, 0.015, 8, 32]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

const TRAIL_COUNT = 90;

function SparkTrail({ runRef }: { runRef: React.MutableRefObject<number> }) {
  const points = useRef<THREE.Points>(null!);
  const { positions, jitter } = useMemo(() => {
    const positions = new Float32Array(TRAIL_COUNT * 3);
    const jitter = Array.from({ length: TRAIL_COUNT }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 0.22,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.22,
    ));
    return { positions, jitter };
  }, []);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const t = clamp01(runRef.current);
    const attr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const back = t - (i / TRAIL_COUNT) * 0.16;
      if (back <= 0 || t <= 0.001) {
        attr.setXYZ(i, 0, -100, 0); // park offscreen
        continue;
      }
      scratch.copy(PATH_CURVE.getPointAt(clamp01(back))).add(jitter[i]);
      attr.setXYZ(i, scratch.x, scratch.y, scratch.z);
    }
    attr.needsUpdate = true;
    points.current.visible = t > 0.01 && t < 0.999;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#a5b4fc"
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

function Runner({ runRef }: { runRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF('/models/Soldier.glb');
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    // Soldier.glb clip order per the official three.js example: 0 Idle, 1 Run, 2 TPose, 3 Walk.
    const runClip = animations[1] ?? animations[0];
    const action = mixer.clipAction(runClip);
    action.reset().play();
    return () => {
      mixer.stopAllAction();
    };
  }, [animations, mixer]);

  useFrame((_, delta) => {
    mixer.update(delta * 1.6);
    const t = clamp01(runRef.current);
    const pos = PATH_CURVE.getPointAt(t < 0.001 ? 0.001 : t);
    const tangent = PATH_CURVE.getTangentAt(t < 0.001 ? 0.001 : t);
    forward.copy(tangent);
    group.current.position.copy(pos);
    group.current.position.y -= 0.07;
    lookTarget.copy(pos).add(forward);
    group.current.lookAt(lookTarget);
    group.current.rotateY(Math.PI);
    group.current.rotateX(-0.15);
    group.current.visible = t < 0.999;
  });

  return (
    <group ref={group} scale={1.05}>
      <primitive object={scene} />
    </group>
  );
}

export default function SplashRunner3D() {
  const drawRef = useRef(0);
  const runRef = useRef(0);
  const elapsedRef = useRef(0);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 42, position: [1.7, 2.7, 8.8], near: 0.1, far: 30 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.65} color="#8b8cf6" />
        <directionalLight position={[3, 5, 4]} intensity={2.3} color="#c7d2fe" />
        <pointLight position={[-3, 1, 2]} intensity={1.6} color="#34D399" />
        <pointLight position={[2, -1, -3]} intensity={0.8} color="#a78bfa" />

        <Clock drawRef={drawRef} runRef={runRef} elapsedRef={elapsedRef} />
        <CameraRig elapsedRef={elapsedRef} />
        <HeroLine progressRef={drawRef} />
        <TipGlow progressRef={drawRef} />
        <CatchFlare elapsedRef={elapsedRef} />
        <SparkTrail runRef={runRef} />
        <Runner runRef={runRef} />

        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.4} mipmapBlur radius={0.75} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

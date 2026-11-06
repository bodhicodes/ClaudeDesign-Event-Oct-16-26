import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CO2 } from "../data";
import { Entrance, Grain, WordReveal } from "../components/Layers";
import { theme } from "../theme";

// Dark variant of the Studio tokens for space. Amber stays the one hero colour.
const D = {
  space: "#04060A",
  text: "#F4F1EA",
  muted: "#9AA3AD",
  hero: theme.colors.primary,
  calm: "#7FB6E6",
};

const PRE = 280;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Timeline (seconds -> frames via fps)
export const PT = { intro: 3, climb: 13, payoff: 5, outro: 3 };

// Deterministic PRNG so every render is identical
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// ------------- textures (render waits until loaded) -------------
const useTextures = () => {
  const [tex, setTex] = useState<Record<string, THREE.Texture> | null>(null);
  const [handle] = useState(() => delayRender("Loading earth textures"));
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const files = {
      day: "tex/earth_atmos_2048.jpg",
      normal: "tex/earth_normal_2048.jpg",
      clouds: "tex/earth_clouds_1024.png",
      lights: "tex/earth_lights_2048.png",
    };
    Promise.all(
      Object.entries(files).map(
        ([k, f]) =>
          new Promise<[string, THREE.Texture]>((res, rej) =>
            loader.load(staticFile(f), (t) => res([k, t]), undefined, rej)
          )
      )
    )
      .then((pairs) => {
        const o = Object.fromEntries(pairs);
        o.day.colorSpace = THREE.SRGBColorSpace;
        o.lights.colorSpace = THREE.SRGBColorSpace;
        Object.values(o).forEach((t) => (t.needsUpdate = true));
        setTex(o);
      })
      .catch((e) => {
        (window as any).__texErr = String(e && (e.message || e.type || e));
        console.error("TEXTURE LOAD FAILED", e);
        continueRender(handle);
      });
  }, [handle]);
  // release the render only after the textured meshes have mounted and drawn
  useEffect(() => {
    if (!tex) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => continueRender(handle));
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [tex, handle]);
  return tex;
};

// ------------- atmosphere glow (fresnel) -------------
const atmoVert = `
varying vec3 vN; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const atmoFrag = `
uniform vec3 uColor; uniform float uPower; uniform float uIntensity;
varying vec3 vN; varying vec3 vV;
void main(){
  float f = pow(1.0 - abs(dot(vN, vV)), uPower);
  gl_FragColor = vec4(uColor, f * uIntensity);
}`;

const Atmosphere: React.FC<{ color: THREE.Color; intensity: number; power: number; radius: number }> = ({
  color,
  intensity,
  power,
  radius,
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        uniforms: { uColor: { value: new THREE.Color() }, uPower: { value: 3 }, uIntensity: { value: 1 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );
  mat.uniforms.uColor.value.copy(color);
  mat.uniforms.uPower.value = power;
  mat.uniforms.uIntensity.value = intensity;
  return (
    <mesh scale={radius} material={mat}>
      <sphereGeometry args={[1, 96, 96]} />
    </mesh>
  );
};

// ------------- the scene -------------
const World: React.FC<{ ppm: number; frame: number; camZ: number; camY: number; tex: Record<string, THREE.Texture> | null }> = ({ ppm, frame, camZ, camY, tex }) => {

  // one particle per ppm above pre-industrial (max ~150)
  const particles = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 160 }, () => {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      return {
        dir: new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)),
        rad: 1.18 + r() * 0.32,
        speed: 0.6 + r() * 0.8,
        phase: r() * 100,
        size: 0.012 + r() * 0.014,
      };
    });
  }, []);
  const stars = useMemo(() => {
    const r = rng(7);
    const pos = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 40 + r() * 20;
      pos.set([s * Math.cos(th) * R, u * R, s * Math.sin(th) * R], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const excess = Math.max(0, ppm - PRE);
  const t = Math.min(1, excess / (CO2[CO2.length - 1][1] - PRE));
  const atmoColor = new THREE.Color(D.calm).lerp(new THREE.Color(D.hero), t);
  const count = Math.floor(excess);
  const rot = frame * 0.0035;

  return (
    <>
      <color attach="background" args={[D.space]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 2, 5]} intensity={3.2} />
      <points geometry={stars}>
        <pointsMaterial size={0.09} color="#ffffff" transparent opacity={0.7} sizeAttenuation />
      </points>

      <group position={[0, 0.18 + camY, -camZ]} rotation={[0.38, 0, 0.1]}>
        {tex && (
          <group rotation={[0, rot, 0]}>
            <mesh>
              <sphereGeometry args={[1, 128, 128]} />
              <meshStandardMaterial
                map={tex.day}
                normalMap={tex.normal}
                normalScale={new THREE.Vector2(0.8, 0.8)}
                emissiveMap={tex.lights}
                emissive={new THREE.Color("#ffd28a")}
                emissiveIntensity={0.22}
                roughness={0.85}
                metalness={0}
              />
            </mesh>
            <mesh rotation={[0, rot * 0.4, 0]} scale={1.012}>
              <sphereGeometry args={[1, 96, 96]} />
              <meshStandardMaterial map={tex.clouds} transparent opacity={0.55} depthWrite={false} />
            </mesh>
          </group>
        )}

        {/* the haze thickens with CO2 */}
        <Atmosphere color={atmoColor} intensity={0.8 + t * 1.0} power={3.4 - t * 1.0} radius={1.12 + t * 0.08} />

        {/* one glowing point per ppm above 280 */}
        {particles.slice(0, count).map((p, i) => {
          const a = (frame * 0.004 * p.speed) + p.phase;
          const pos = p.dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a).multiplyScalar(p.rad + Math.sin(frame / 25 + p.phase) * 0.015);
          return (
            <mesh key={i} position={pos}>
              <sphereGeometry args={[p.size, 12, 12]} />
              <meshBasicMaterial color={D.hero} transparent opacity={0.9} />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

// ------------- overlays -------------
const Mono: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = D.muted, size = 22 }) => (
  <div style={{ fontFamily: theme.fonts.mono, fontWeight: 500, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color }}>
    {children}
  </div>
);

export const Planet: React.FC = () => {
  const tex = useTextures();
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const intro = Math.round(PT.intro * fps);
  const climbEnd = intro + Math.round(PT.climb * fps);
  const payEnd = climbEnd + Math.round(PT.payoff * fps);

  // data progress
  const prog = interpolate(frame, [intro, climbEnd - 20], [0, 1], { easing: theme.ease.inOut, ...clamp });
  const idx = prog * (CO2.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = CO2[i], b = CO2[Math.min(i + 1, CO2.length - 1)];
  const yr = a[0] + (b[0] - a[0]) * f;
  // before the climb starts the planet sits at pre-industrial clarity, then jumps to 1959
  const pre = interpolate(frame, [intro - 30, intro], [PRE, a[1]], { easing: theme.ease.out, ...clamp });
  const ppm = frame < intro ? pre : a[1] + (b[1] - a[1]) * f;

  // camera: push in during the climb, pull back for the payoff
  const enter = interpolate(frame, [0, intro], [8, 4.6], { easing: theme.ease.out, ...clamp });
  const pull = interpolate(frame, [climbEnd, climbEnd + 40], [0, 2.6], { easing: theme.ease.inOut, ...clamp });
  const camZ = enter + pull + Math.sin(frame / 60) * 0.04;
  const camY = interpolate(frame, [climbEnd, climbEnd + 40], [0, 0.95], { easing: theme.ease.inOut, ...clamp });

  const excess = Math.max(0, Math.floor(ppm - PRE));
  const pct = Math.round((CO2[CO2.length - 1][1] / PRE - 1) * 100);

  // overlay visibility windows (fast exits)
  const win = (s: number, e: number) =>
    interpolate(frame, [s, s + 1, e - 12, e - 2], [0, 1, 1, 0], clamp);
  const readout = win(intro - 4, climbEnd + 8);
  const payP = spring({ frame: frame - climbEnd - 18, fps, config: theme.spring.bouncy });
  const payN = interpolate(spring({ frame: frame - climbEnd - 22, fps, config: { damping: 30, stiffness: 60 } }), [0, 1], [0, pct]);
  const pay = win(climbEnd + 10, payEnd);
  const out = win(payEnd, durationInFrames + 12);
  const introW = win(0, intro + 6);
  const legend = spring({ frame: frame - intro - 40, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ background: D.space }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 32, position: [0, 0, 0] }}>
        <World ppm={ppm} frame={frame} camZ={camZ} camY={camY} tex={tex} />
      </ThreeCanvas>

      {/* intro title */}
      <AbsoluteFill style={{ opacity: introW, padding: "120px 140px", justifyContent: "flex-start" }}>
        <Entrance delay={4}><Mono color={D.muted}>Earth's atmosphere · 1959 to 2025</Mono></Entrance>
        <WordReveal
          text="Watch the air change."
          delay={10}
          style={{ marginTop: 22, fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 112, letterSpacing: "-0.02em", color: D.text }}
        />
      </AbsoluteFill>

      {/* live readout */}
      <AbsoluteFill style={{ opacity: readout, padding: "0 140px 110px", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Mono>Atmospheric CO₂ · Mauna Loa</Mono>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 140, lineHeight: 1, color: D.text, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
                {ppm.toFixed(1)}
              </span>
              <span style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 38, color: D.muted }}>ppm</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
            <span style={{ fontFamily: theme.fonts.mono, fontWeight: 500, fontSize: 72, color: D.text, fontVariantNumeric: "tabular-nums" }}>
              {frame < intro ? "" : Math.round(yr)}
            </span>
            <div
              style={{
                opacity: legend, transform: `translateY(${interpolate(legend, [0, 1], [20, 0])}px)`,
                display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 7, background: D.hero, boxShadow: `0 0 18px ${D.hero}` }} />
              <span style={{ fontFamily: theme.fonts.body, fontSize: 26, color: D.muted, fontVariantNumeric: "tabular-nums" }}>
                each point = 1 ppm above pre-industrial · {excess}
              </span>
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* payoff */}
      <AbsoluteFill style={{ opacity: pay, justifyContent: "flex-end", alignItems: "center", paddingBottom: 120, gap: 12 }}>
        <Mono>2025 vs. pre-industrial · 280 ppm</Mono>
        <div
          style={{
            fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 200, lineHeight: 1, letterSpacing: "-0.04em",
            color: D.text, fontVariantNumeric: "tabular-nums",
            opacity: payP, transform: `scale(${interpolate(payP, [0, 1], [0.85, 1])})`,
          }}
        >
          +{Math.round(payN)}%
        </div>
        <WordReveal
          text="More carbon dioxide than before the industrial age."
          delay={climbEnd + 34}
          style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 40, color: D.text, columnGap: 12, justifyContent: "center" }}
        />
      </AbsoluteFill>

      {/* outro */}
      <AbsoluteFill style={{ opacity: out, padding: "0 140px 120px", justifyContent: "flex-end", gap: 24 }}>
        <div style={{ fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 88, color: D.text, letterSpacing: "-0.02em" }}>Terra Studio</div>
        <Mono>Data · NOAA GML, Mauna Loa annual mean CO₂, 1959–2025</Mono>
      </AbsoluteFill>

      {/* grade, grain, vignette */}
      <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse at 50% 55%, transparent 40%, ${D.space}cc 100%)` }} />
      <AbsoluteFill style={{ pointerEvents: "none", backgroundColor: D.hero, mixBlendMode: "soft-light", opacity: 0.06 + 0.08 * prog }} />
      <Grain />

      {/* sound */}
      <Audio src={staticFile("sfx/pad24.wav")} volume={0.3} />
      <Sequence from={0} durationInFrames={20}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} /></Sequence>
      {[1970, 1980, 1990, 2000, 2010, 2020].map((y) => {
        const p = (y - 1959) / (2025 - 1959);
        const fr = intro + Math.round(p * (climbEnd - 20 - intro));
        return (
          <Sequence key={y} from={fr - 2} durationInFrames={6}>
            <Audio src={staticFile("sfx/tick.wav")} volume={0.35} />
          </Sequence>
        );
      })}
      <Sequence from={climbEnd + 15} durationInFrames={20}><Audio src={staticFile("sfx/bass.wav")} volume={0.75} /></Sequence>
      <Sequence from={payEnd - 3} durationInFrames={20}><Audio src={staticFile("sfx/whoosh.wav")} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};

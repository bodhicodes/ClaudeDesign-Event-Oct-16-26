import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

// ---- Fonts: local woff2 files, render waits until they load ----
const fontHandle = delayRender("Loading fonts");
const faces: [string, string, string][] = [
  [theme.fonts.display, "fonts/newsreader-500.woff2", "500"],
  [theme.fonts.body, "fonts/dmsans-400.woff2", "400"],
  [theme.fonts.body, "fonts/dmsans-500.woff2", "500"],
  [theme.fonts.mono, "fonts/plexmono-500.woff2", "500"],
];
Promise.all(
  faces.map(([family, file, weight]) => {
    const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
    return f.load().then((l) => document.fonts.add(l));
  })
)
  .then(() => continueRender(fontHandle))
  .catch((e) => {
    console.error(e);
    continueRender(fontHandle);
  });

// ---- Layer 1: background mesh ----
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 50;
  const d2 = Math.cos(frame / 70) * 40;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div
        style={{
          position: "absolute", width: 1300, height: 1300, borderRadius: "50%",
          top: -620, left: -380 + d1, filter: "blur(60px)",
          background: `radial-gradient(circle, ${theme.colors.green}1F, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute", width: 1000, height: 1000, borderRadius: "50%",
          bottom: -520, right: -300 - d2, filter: "blur(70px)",
          background: `radial-gradient(circle, ${theme.colors.primary}26, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---- Layer 4: colour grade ----
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.green, mixBlendMode: "soft-light", opacity: 0.1 }} />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(20,23,26,0.02), transparent 28%, transparent 72%, rgba(20,23,26,0.03))",
      }}
    />
  </AbsoluteFill>
);

// ---- Layer 5: grain + vignette ----
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.06, mixBlendMode: "multiply",
      }}
    />
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at center, transparent 58%, rgba(20,23,26,0.06) 100%)",
    }}
  />
);

// ---- Motion primitives ----
export const Entrance: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const WordReveal: React.FC<{ text: string; delay?: number; per?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 0,
  per = 3,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: 22, ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: theme.spring.snappy });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Scene wrapper: fast exit over the last 12 frames
export const SceneExit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = [durationInFrames - 12, durationInFrames - 2];
  const y = interpolate(frame, t, [0, -42], { easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = interpolate(frame, t, [1, 0], { easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};

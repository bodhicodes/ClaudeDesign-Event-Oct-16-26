import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { CO2 } from "../data";
import { Entrance, SceneExit, WordReveal } from "../components/Layers";

const C = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Label: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.green }) => (
  <div
    style={{
      fontFamily: theme.fonts.mono, fontWeight: 500, fontSize: 24, letterSpacing: "0.14em",
      textTransform: "uppercase", color,
    }}
  >
    {children}
  </div>
);

// ---------------- Scene 1: hook ----------------
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 22) * 0.008;
  return (
    <SceneExit>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 180px", gap: 36 }}>
        <Entrance delay={2}>
          <Label>Mauna Loa Observatory · Hawaii</Label>
        </Entrance>
        <div style={{ transform: `scale(${breathe})`, transformOrigin: "left center" }}>
          <WordReveal
            text="Since 1959, one hilltop has measured the air every year."
            delay={8}
            style={{
              fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 104, lineHeight: 1.05,
              letterSpacing: "-0.02em", color: C.ink, maxWidth: 1450,
            }}
          />
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};

// ---------------- Scene 2: the curve draws itself ----------------
const W = 1520, H = 600;
const X0 = 1959, X1 = 2025, Y0 = 270, Y1 = 440;
const sx = (yr: number) => ((yr - X0) / (X1 - X0)) * W;
const sy = (ppm: number) => H - ((ppm - Y0) / (Y1 - Y0)) * H;

export const DRAW_START = 20;
export const DRAW_END = 270;

export const Curve: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const prog = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], { easing: theme.ease.inOut, ...clamp });
  const idx = prog * (CO2.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const a = CO2[i];
  const b = CO2[Math.min(i + 1, CO2.length - 1)];
  const headYr = a[0] + (b[0] - a[0]) * f;
  const headPpm = a[1] + (b[1] - a[1]) * f;

  const pts = CO2.slice(0, i + 1).map(([y, p]) => `${sx(y)},${sy(p)}`);
  pts.push(`${sx(headYr)},${sy(headPpm)}`);

  const axes = spring({ frame: frame - 2, fps, config: theme.spring.smooth });
  const base = spring({ frame: frame - 10, fps, config: theme.spring.smooth });
  const pill = spring({ frame: frame - (DRAW_END + 12), fps, config: theme.spring.bouncy });
  const done = frame > DRAW_END;
  const pulse = done ? 1 + Math.sin((frame - DRAW_END) / 6) * 0.12 : 1;

  return (
    <SceneExit>
      <AbsoluteFill style={{ padding: "96px 200px 0", gap: 40 }}>
        {/* readout */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: axes }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label color={C.muted}>Atmospheric CO₂ · annual mean</Label>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <span
                style={{
                  fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 150, lineHeight: 1,
                  letterSpacing: "-0.03em", color: C.ink, fontVariantNumeric: "tabular-nums",
                }}
              >
                {headPpm.toFixed(1)}
              </span>
              <span style={{ fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 40, color: C.ink3 }}>ppm</span>
            </div>
          </div>
          <span
            style={{
              fontFamily: theme.fonts.mono, fontWeight: 500, fontSize: 64, color: C.green,
              fontVariantNumeric: "tabular-nums", paddingBottom: 14,
            }}
          >
            {Math.round(headYr)}
          </span>
        </div>

        {/* chart */}
        <div style={{ position: "relative", width: W, height: H }}>
          <svg width={W} height={H} style={{ overflow: "visible" }}>
            {[300, 350, 400].map((v) => (
              <g key={v} opacity={axes}>
                <line x1={0} x2={W} y1={sy(v)} y2={sy(v)} stroke={C.rule} strokeWidth={2} />
                <text x={-24} y={sy(v) + 8} textAnchor="end" fontFamily={theme.fonts.mono} fontSize={22} fill={C.muted}>
                  {v}
                </text>
              </g>
            ))}
            {[1960, 1980, 2000, 2020].map((yr) => (
              <text
                key={yr} x={sx(yr)} y={H + 44} textAnchor="middle" opacity={axes}
                fontFamily={theme.fonts.mono} fontSize={22} fill={C.muted}
              >
                {yr}
              </text>
            ))}
            {/* pre-industrial reference */}
            <g opacity={base}>
              <line
                x1={0} x2={W * base} y1={sy(280)} y2={sy(280)}
                stroke={C.ink3} strokeWidth={2.5} strokeDasharray="10 10"
              />
              <text x={W} y={sy(280) - 16} textAnchor="end" fontFamily={theme.fonts.mono} fontSize={22} fill={C.ink3}>
                PRE-INDUSTRIAL ≈ 280 PPM
              </text>
            </g>
            {/* the curve */}
            <polyline
              points={pts.join(" ")} fill="none" stroke={C.green} strokeWidth={7}
              strokeLinejoin="round" strokeLinecap="round"
            />
            <circle
              cx={sx(headYr)} cy={sy(headPpm)} r={13 * pulse} fill={C.green}
              opacity={prog > 0 ? 1 : 0}
            />
          </svg>

          {/* hero annotation: the only amber element */}
          <div
            style={{
              position: "absolute", left: sx(1990) - 40, top: sy(415) - 40,
              opacity: pill,
              transform: `translateY(${interpolate(pill, [0, 1], [24, 0])}px) scale(${interpolate(pill, [0, 1], [0.85, 1])})`,
              transformOrigin: "left center",
              background: C.primary, color: C.ink, borderRadius: 999, padding: "16px 30px",
              fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 36,
              boxShadow: `0 0 50px ${C.primary}55`,
            }}
          >
            +111 ppm since 1959
          </div>
        </div>
      </AbsoluteFill>
    </SceneExit>
  );
};

// ---------------- Scene 3: payoff ----------------
const PRE_INDUSTRIAL = 280;
const PCT = Math.round((CO2[CO2.length - 1][1] / PRE_INDUSTRIAL - 1) * 100);
export const Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = interpolate(spring({ frame: frame - 6, fps, config: { damping: 30, stiffness: 60 } }), [0, 1], [0, PCT]);
  const big = spring({ frame: frame - 2, fps, config: theme.spring.bouncy });
  const breathe = 1 + Math.sin(frame / 22) * 0.01;
  return (
    <SceneExit>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 28 }}>
        <Entrance delay={0}>
          <Label color={C.muted}>2025 vs. pre-industrial</Label>
        </Entrance>
        <div
          style={{
            fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 300, lineHeight: 0.95,
            letterSpacing: "-0.04em", color: C.green, fontVariantNumeric: "tabular-nums",
            opacity: big, transform: `scale(${interpolate(big, [0, 1], [0.8, 1]) * breathe})`,
          }}
        >
          +{Math.round(n)}%
        </div>
        <WordReveal
          text="More carbon dioxide in the air than before the industrial age."
          delay={22}
          style={{
            fontFamily: theme.fonts.body, fontWeight: 500, fontSize: 48, color: C.ink,
            justifyContent: "center", columnGap: 14, maxWidth: 1200,
          }}
        />
      </AbsoluteFill>
    </SceneExit>
  );
};

// ---------------- Scene 4: source + sign-off ----------------
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const float = Math.sin(frame / 30) * 3;
  return (
    <SceneExit>
      <AbsoluteFill style={{ justifyContent: "center", padding: "0 200px", gap: 30 }}>
        <Entrance delay={2}>
          <div
            style={{
              fontFamily: theme.fonts.display, fontWeight: 500, fontSize: 96, letterSpacing: "-0.02em",
              color: C.ink, transform: `translateY(${float}px)`,
            }}
          >
            Terra Studio
          </div>
        </Entrance>
        <Entrance delay={8}>
          <div style={{ width: 120, height: 6, background: C.green, borderRadius: 3 }} />
        </Entrance>
        <Entrance delay={14}>
          <Label color={C.ink3}>Data · NOAA Global Monitoring Laboratory, Mauna Loa annual mean, 1959–2025</Label>
        </Entrance>
      </AbsoluteFill>
    </SceneExit>
  );
};

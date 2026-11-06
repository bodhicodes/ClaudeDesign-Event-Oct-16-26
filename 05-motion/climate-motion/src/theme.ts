// theme.ts — single source of truth. Terra Studio tokens (from the Built Route design handoff).
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#FBFAF7",
    bgAlt: "#F3F0EA",
    ink: "#14171A",
    ink3: "#3B4147",
    muted: "#8A9098",
    rule: "#E4E1D9",
    green: "#0B6B45", // the curve, the brand
    primary: "#F5A623", // THE hero color, one element per frame
    tintGreen: "#EDF3EF",
  },
  fonts: {
    display: "Newsreader",
    body: "DM Sans",
    mono: "IBM Plex Mono",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
} as const;

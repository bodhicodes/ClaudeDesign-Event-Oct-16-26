import React from "react";
import { AbsoluteFill, Audio, Composition, Sequence, staticFile, useVideoConfig } from "remotion";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Curve, DRAW_END, DRAW_START, Hook, Outro, Payoff } from "./scenes/Scenes";
import { CO2 } from "./data";
import { Planet, PT } from "./planet/Planet";

// Scene timing in seconds; converted with fps so nothing is a magic frame number
const T = { hook: 3, curve: 11.5, payoff: 4, outro: 2.5 };

const Keeling: React.FC = () => {
  const { fps } = useVideoConfig();
  const hook = Math.round(T.hook * fps);
  const curve = Math.round(T.curve * fps);
  const payoff = Math.round(T.payoff * fps);
  const outro = Math.round(T.outro * fps);
  const s2 = hook, s3 = s2 + curve, s4 = s3 + payoff;

  // decade ticks while the curve draws (approximate, eased timing is close enough for a tick)
  const decades = [1970, 1980, 1990, 2000, 2010, 2020].map((yr) => {
    const p = (yr - CO2[0][0]) / (CO2[CO2.length - 1][0] - CO2[0][0]);
    return s2 + DRAW_START + Math.round(p * (DRAW_END - DRAW_START));
  });

  return (
    <AbsoluteFill>
      <BgMesh />
      <Sequence durationInFrames={hook}><Hook /></Sequence>
      <Sequence from={s2} durationInFrames={curve}><Curve /></Sequence>
      <Sequence from={s3} durationInFrames={payoff}><Payoff /></Sequence>
      <Sequence from={s4} durationInFrames={outro}><Outro /></Sequence>
      <Grade />
      <Grain />
      <Vignette />

      <Audio src={staticFile("sfx/pad.wav")} volume={0.25} />
      {[0, s2, s3, s4].map((f, i) => (
        <Sequence key={`w${i}`} from={Math.max(0, f - 3)} durationInFrames={20}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
        </Sequence>
      ))}
      {decades.map((f, i) => (
        <Sequence key={`t${i}`} from={f - 2} durationInFrames={6}>
          <Audio src={staticFile("sfx/tick.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={s2 + DRAW_END + 10} durationInFrames={10}>
        <Audio src={staticFile("sfx/pop.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={s3} durationInFrames={20}>
        <Audio src={staticFile("sfx/bass.wav")} volume={0.7} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Planet" component={Planet} durationInFrames={Math.round((PT.intro + PT.climb + PT.payoff + PT.outro) * 30)} fps={30} width={1920} height={1080} />
    <Composition id="Keeling" component={Keeling} durationInFrames={630} fps={30} width={1920} height={1080} />
  </>
);

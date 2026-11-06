# 5. Make it move

Most climate data is about change over time, and motion shows the change as it happens: a line climbing from 316 ppm in 1959 to 427 ppm in 2025. A video under half a minute long also works on social channels.

We used [Remotion](https://www.remotion.dev), an open-source tool that turns React code into video, with a [Remotion skill for Claude Code](https://github.com/haidrrrry/claude-remotion-skill). The skill gives Claude animation rules, such as no linear easing and staggered entrances. It also makes Claude render stills, check them and fix problems before the full render.

What's in this folder:

- [`media/keeling-curve.mp4`](media/keeling-curve.mp4): 21 seconds of Mauna Loa CO₂, 1959 to 2025
- [`media/planet-co2.mp4`](media/planet-co2.mp4): a 24-second 3D Earth whose atmosphere thickens and turns amber as CO₂ climbs
- [`climate-motion/`](climate-motion/): the Remotion project that made both, so you can open them, change them and render your own

## Open the finished project

```
cd 05-motion/climate-motion
npm install
npm run textures
npm run studio
```

`npm run textures` downloads the Earth images for the planet. Remotion Studio opens in your browser with both videos in the sidebar. Drag the playhead to scrub through the years, and ask Claude Code for changes while it's open: Studio reloads as soon as the code changes. To render a video file, run `npm run render:keeling` or `npm run render:planet`.

## Build it yourself, one prompt at a time

We build in small steps. Each gives Claude one job and something to check before moving on, so when something goes wrong you know which step caused it.

### Install the skill

```
Install the Remotion motion graphics skill from
https://github.com/haidrrrry/claude-remotion-skill into my user skills folder
(~/.claude/skills). Then read its SKILL.md and give me a five-line summary of
the rules it will make you follow.
```

The summary is how you confirm the skill loaded. It should mention no linear easing, staggered entrances, and the render, inspect, fix loop. If you'd rather do it by hand:

```
git clone https://github.com/haidrrrry/claude-remotion-skill.git
cp -r claude-remotion-skill/remotion-motion-graphics ~/.claude/skills/
```

### The Keeling curve

**1. Get the data first.**

```
Create a new Remotion project in a folder called climate-motion.
Download NOAA's annual mean CO2 data for Mauna Loa from
https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt
and save it as src/data.ts, an array of [year, ppm] pairs.
Show me the first year, the last year and their values. Don't build anything yet.
```

Check the numbers yourself before going on: 1959 should be about 316 ppm and 2025 about 427 ppm.

**2. Give it a design system.**

```
Create src/theme.ts using the skill's theme template, with these tokens:
background #FBFAF7, ink #14171A, secondary text #3B4147, muted #8A9098,
rules #E4E1D9, brand green #0B6B45, hero amber #F5A623.
Fonts: Newsreader for headlines, DM Sans for body, IBM Plex Mono for labels.
Load the fonts from local files, not from the web. Amber is the hero colour
and appears on one element per frame at most.
```

These are Terra Studio's own tokens. Swap in yours from step 1. Every scene reads its colours and fonts from this one file, so the video matches your pages.

**3. Build the scenes, then look at stills.**

```
Build a 21-second, 1920x1080 composition called Keeling with four scenes:
1. Hook: "Since 1959, one hilltop has measured the air every year."
2. The curve draws itself from 1959 to 2025. A large ppm counter and the year
   tick up with it. Show a dashed reference line for pre-industrial (about 280 ppm).
   When the line finishes, an amber pill says how much CO2 has risen since 1959.
3. Payoff: the percentage increase over 280 ppm, calculated from the data.
4. Source card: NOAA Global Monitoring Laboratory, Mauna Loa annual mean, 1959-2025.
Follow the skill's rules. Don't render the video yet. Render stills at frames
40, 200, 330, 395, 480 and 600 and show them to me.
```

Every number on screen is calculated from the data. Stills take seconds and a full render takes minutes, so you review a few frames first. The 21 seconds and 1920x1080 were our choice, and a prompt that just asks for a short video works too.

**4. Check, fix, render.**

```
Look at the stills with me. Check: text touching edges, anything that appears
before its entrance, more than one amber element in a frame, and whether the
corners look muddy on the light background. Fix what you find, re-render the
stills, then render the full video with sound.
```

In our run, Claude lightened the vignette because the corners looked grey, and it replaced a rounded +50% with the +53% the data gives.

**5. Change something in Studio.**

```
Open it in Remotion Studio. Make the curve terracotta instead of green, and
make the curve take two seconds longer to draw.
```

Because the colours live in the theme file, one change updates every scene.

### The planet

This took Claude about 45 minutes to build and about 12 minutes to render on a machine without a graphics card, so in the session we showed the prompts and the result.

**1. Set up 3D on its own first.**

```
In the same project, add Remotion's 3D support (@remotion/three with three and
@react-three/fiber, matching the installed Remotion version). Download the
Earth textures (day map, normal map, clouds, night lights) from the three.js
examples on GitHub into public/tex. Render one still of a textured, lit,
rotating Earth on a dark background and show it to me.
```

In our run the first still came back as a black ball, because the frame was captured before the textures had loaded. Claude found the cause and made the render wait for them.

**2. Make the data visible.**

```
Build a composition called Planet that uses the same CO2 data:
- A glowing atmosphere around the Earth that shifts from pale blue to amber,
  and thickens as ppm rises.
- One small amber point orbiting the planet for every 1 ppm above
  pre-industrial (280 ppm). They appear as the years pass.
- A ppm counter, the year, and a legend: "each point = 1 ppm above pre-industrial".
Use a dark version of our theme. Amber is still the only hero colour.
```

Each point stands for 1 ppm, so 1959 starts with 35 points and 2025 ends with 147. The legend tells the viewer how to read it.

**3. Camera, payoff and sound.**

```
Open with "Watch the air change." while the camera pushes in. At the end of the
climb, pull the camera back and lift the planet so the payoff (+53% over
pre-industrial) sits clear of it. End on a card with the data source.
Add a quiet pad, ticks at each decade and a low hit on the payoff.
Render stills at 2, 9, 15, 18.5 and 22.5 seconds and check the framing before
the full render.
```

In our first stills the payoff text sat on top of the planet. Claude moved the camera, checked the stills again, and only then started the long render.

Remotion is free for individuals, non-profits and companies of up to three people. Larger companies need a [company licence](https://www.remotion.dev/license).

Back to the [start](../)

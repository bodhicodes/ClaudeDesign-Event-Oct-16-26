// Downloads the Earth textures used by the Planet composition into public/tex.
// They come from the three.js examples and are not redistributed in this repo.
import { mkdir, writeFile } from "node:fs/promises";

const base = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/";
const files = ["earth_atmos_2048.jpg", "earth_normal_2048.jpg", "earth_clouds_1024.png", "earth_lights_2048.png"];

await mkdir("public/tex", { recursive: true });
for (const f of files) {
  const res = await fetch(base + f);
  if (!res.ok) throw new Error(`Could not download ${f}: ${res.status}`);
  await writeFile(`public/tex/${f}`, Buffer.from(await res.arrayBuffer()));
  console.log("saved public/tex/" + f);
}

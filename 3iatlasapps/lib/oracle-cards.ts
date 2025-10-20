export type OracleCard = { id: number; name: string; title: string; meaning: string; image: string };
export const CARDS: OracleCard[] = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: ["Cosmic Messenger","Interstellar Journey","Martian Threshold","Solar Wind","Deep Space Echo","Perihelion Moment","Hyperbolic Path","Cosmic Debris","Observatory Moment","Infinite Trajectory"][i],
  title: ["Signals Arrive","Ancient Pathways","Critical Brilliance","Destiny Drift","Patterns Return","Maximum Power","No Return","Hidden Treasure","Witnessed","Beyond Influence"][i],
  meaning: ["Be attentive to subtle pings.","Trust the long arc.","Your edge is a doorway.","Invisible forces push gently.","Old signals recur with meaning.","You are seen. Step forward.","Transformation completes in motion.","Assemble the fragments.","Your work is noted by the cosmos.","Your orbit touches many."][i],
  image: `/images/oracle/cards/${i + 1}.png`,
}));
export function pickDeterministic(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i=0;i<seed.length;i++){ h ^= seed.charCodeAt(i); h = Math.imul(h,16777619); }
  return CARDS[Number(h % CARDS.length)];
}

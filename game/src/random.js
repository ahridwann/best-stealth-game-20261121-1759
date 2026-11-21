// Gilded Shadows — a tiny seeded random generator. The same seed always
// deals the same game, which is what makes the staged screenshots
// reproducible: ?shot=cover&seed=7 looks the same every time.

// mulberry32: a small, fast, well-behaved seeded PRNG.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    // A float in [lo, hi).
    range(lo, hi) {
      return lo + next() * (hi - lo);
    },
    // An integer in [lo, hi].
    int(lo, hi) {
      return Math.floor(lo + next() * (hi - lo + 1));
    },
    // One element of an array, uniformly.
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}

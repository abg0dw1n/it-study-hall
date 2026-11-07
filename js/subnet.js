// Subnetting math and a generator of practice problems. Pure functions (no DOM) so they can be tested in Node.
// A problem is { kind, prompt, answer, accept(input) -> bool, hint, steps[] } where `answer` is the text shown when revealed.

export const ip2n = (s) => s.split('.').reduce((a, o) => a * 256 + Number(o), 0);
export const n2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
export const maskN = (c) => (c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0);
export const mask = (c) => n2ip(maskN(c));
export const wildcard = (c) => n2ip(~maskN(c) >>> 0);
export const network = (ip, c) => n2ip((ip2n(ip) & maskN(c)) >>> 0);
export const broadcast = (ip, c) => n2ip(((ip2n(ip) & maskN(c)) | (~maskN(c) >>> 0)) >>> 0);
export const hosts = (c) => (c >= 31 ? (c === 31 ? 2 : 1) : 2 ** (32 - c) - 2);
export const firstHost = (ip, c) => n2ip(ip2n(network(ip, c)) + 1);
export const lastHost = (ip, c) => n2ip(ip2n(broadcast(ip, c)) - 1);
export const bin = (n) => [24, 16, 8, 0].map((s) => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.');
export const binIp = (ip) => bin(ip2n(ip));
export const cidrForHosts = (h) => { let b = 2; while (2 ** b - 2 < h) b++; return 32 - b; };
export const cidrFromMask = (m) => { const n = ip2n(m); for (let c = 0; c <= 32; c++) if (maskN(c) === n) return c; return -1; };
export const sameSubnet = (a, b, c) => network(a, c) === network(b, c);
export const isIp = (s) => /^(\d{1,3})(\.\d{1,3}){3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[rnd(0, a.length - 1)];

// Random private-ish address so the practice looks like real exam questions.
function randomIp() {
  const t = rnd(0, 5);
  if (t === 0) return `10.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
  if (t === 1) return `172.${rnd(16, 31)}.${rnd(0, 255)}.${rnd(1, 254)}`;
  if (t === 2) return `192.168.${rnd(0, 255)}.${rnd(1, 254)}`;
  if (t === 3) return `${rnd(11, 126)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
  if (t === 4) return `${rnd(129, 191)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
  return `${rnd(193, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
}

// Difficulty decides which prefix lengths appear.
const RANGE = { easy: [24, 30], medium: [16, 30], hard: [8, 30] };
const prefix = (level) => rnd(...RANGE[level]);

const clean = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '');
const ipEq = (want) => (got) => clean(got) === want;
const numEq = (want) => (got) => clean(got).replace(/,/g, '') === String(want);
// Accepts 255.255.255.0, /24 or 24.
const maskOrCidr = (c) => (got) => { const g = clean(got).replace(/^\//, ''); return g === String(c) || g === mask(c); };
const cidrAns = (c) => (got) => clean(got).replace(/^\//, '') === String(c);

function stepsNet(ip, c) {
  const m = mask(c);
  return [`Prefix /${c} = mask ${m}`, `IP   ${binIp(ip)}`, `Mask ${bin(maskN(c))}`, `AND  ${binIp(network(ip, c))}  →  ${network(ip, c)}`];
}

export const KINDS = {
  network: { label: 'Network address', make(level) {
    const c = prefix(level), ip = randomIp();
    return { prompt: `What is the network address of ${ip}/${c}?`, answer: network(ip, c), accept: ipEq(network(ip, c)),
      hint: 'AND the address with the mask, or find the multiple of the block size at or below the interesting octet.', steps: stepsNet(ip, c) };
  } },
  broadcast: { label: 'Broadcast address', make(level) {
    const c = prefix(level), ip = randomIp();
    return { prompt: `What is the broadcast address of ${ip}/${c}?`, answer: broadcast(ip, c), accept: ipEq(broadcast(ip, c)),
      hint: 'The broadcast is the network address with every host bit set to 1 (the last address in the subnet).',
      steps: [...stepsNet(ip, c), `Set the ${32 - c} host bits to 1 → ${broadcast(ip, c)}`] };
  } },
  usable: { label: 'Usable hosts', make(level) {
    const c = rnd(...RANGE[level]), h = hosts(c);
    return { prompt: `How many usable host addresses are in a /${c} subnet?`, answer: String(h), accept: numEq(h),
      hint: 'Usable hosts = 2^(host bits) − 2.', steps: [`Host bits = 32 − ${c} = ${32 - c}`, `2^${32 - c} − 2 = ${h}`] };
  } },
  mask: { label: 'Mask from prefix', make(level) {
    const c = prefix(level);
    return { prompt: `Write /${c} as a dotted-decimal subnet mask.`, answer: mask(c), accept: ipEq(mask(c)),
      hint: `${c} one-bits, then zeros. Each full octet of ones is 255.`, steps: [bin(maskN(c)), mask(c)] };
  } },
  cidr: { label: 'Prefix from mask', make(level) {
    const c = prefix(level);
    return { prompt: `What prefix length (CIDR) is the mask ${mask(c)}? (for example /24)`, answer: `/${c}`, accept: cidrAns(c),
      hint: 'Count the one-bits in the mask.', steps: [bin(maskN(c)), `${c} one-bits → /${c}`] };
  } },
  first: { label: 'First usable host', make(level) {
    const c = rnd(RANGE[level][0], 30), ip = randomIp();
    return { prompt: `What is the first usable host address in the subnet containing ${ip}/${c}?`, answer: firstHost(ip, c), accept: ipEq(firstHost(ip, c)),
      hint: 'First usable = network address + 1.', steps: [...stepsNet(ip, c), `+ 1 → ${firstHost(ip, c)}`] };
  } },
  last: { label: 'Last usable host', make(level) {
    const c = rnd(RANGE[level][0], 30), ip = randomIp();
    return { prompt: `What is the last usable host address in the subnet containing ${ip}/${c}?`, answer: lastHost(ip, c), accept: ipEq(lastHost(ip, c)),
      hint: 'Last usable = broadcast address − 1.', steps: [`Broadcast: ${broadcast(ip, c)}`, `− 1 → ${lastHost(ip, c)}`] };
  } },
  forhosts: { label: 'Smallest prefix for N hosts', make(level) {
    const need = level === 'easy' ? pick([2, 5, 10, 25, 50, 100]) : level === 'medium' ? rnd(2, 1000) : rnd(2, 60000);
    const c = cidrForHosts(need);
    return { prompt: `What is the longest prefix (smallest subnet) that still fits ${need.toLocaleString('en-US')} usable hosts? (for example /26)`, answer: `/${c}`, accept: cidrAns(c),
      hint: 'Find the smallest power of two that is at least hosts + 2.', steps: [`${need} + 2 (network and broadcast) = ${need + 2}`, `2^${32 - c} = ${2 ** (32 - c)} ≥ ${need + 2}`, `32 − ${32 - c} = /${c}`] };
  } },
  same: { label: 'Same subnet?', make(level) {
    const c = rnd(RANGE[level][0], 29), a = randomIp();
    const base = ip2n(network(a, c)), size = 2 ** (32 - c);
    const yes = Math.random() < 0.5;
    let bn;
    if (yes) bn = base + rnd(0, size - 1);
    else { const k = pick([-1, 1, 2]); bn = base + k * size + rnd(0, size - 1); }
    const b = n2ip(bn >>> 0);
    const ok = sameSubnet(a, b, c);
    return { prompt: `With mask ${mask(c)} (/${c}), are ${a} and ${b} in the same subnet? (yes or no)`, answer: ok ? 'Yes' : 'No',
      accept: (g) => ['yes', 'y', 'same'].includes(clean(g)) === ok && ['yes', 'y', 'same', 'no', 'n', 'different'].includes(clean(g)),
      hint: 'Compare the network address of each host.', steps: [`${a} → ${network(a, c)}`, `${b} → ${network(b, c)}`, ok ? 'Same network address → yes' : 'Different network addresses → no'] };
  } },
  nextsubnet: { label: 'Next subnet', make(level) {
    const c = rnd(Math.max(RANGE[level][0], 17), 29), ip = randomIp();
    const nxt = n2ip(((ip2n(network(ip, c)) + 2 ** (32 - c)) >>> 0));
    return { prompt: `What is the network address of the next subnet after the one containing ${ip}/${c}?`, answer: nxt, accept: ipEq(nxt),
      hint: 'Add the block size (2^host bits) to this subnet\'s network address.', steps: [`This subnet: ${network(ip, c)}/${c}`, `Block size = 2^${32 - c} = ${2 ** (32 - c)}`, `Next: ${nxt}`] };
  } },
  wildcard: { label: 'Wildcard mask', make(level) {
    const c = rnd(RANGE[level][0], 30);
    return { prompt: `What is the wildcard mask for /${c}? (used in OSPF network statements and ACLs)`, answer: wildcard(c), accept: ipEq(wildcard(c)),
      hint: 'Wildcard = 255.255.255.255 minus the subnet mask (flip every bit).', steps: [`Mask ${mask(c)}`, `255.255.255.255 − ${mask(c)} = ${wildcard(c)}`] };
  } },
};

export const LEVELS = { easy: 'Easy (/24–/30)', medium: 'Medium (/16–/30)', hard: 'Hard (/8–/30)' };
export const kindList = Object.keys(KINDS);

// kinds: array of KINDS keys ([] or null = all of them, mixed)
export function makeProblem(kinds, level = 'medium') {
  const pool = kinds?.length ? kinds.filter((k) => KINDS[k]) : kindList;
  const kind = pick(pool.length ? pool : kindList);
  return { kind, level, ...KINDS[kind].make(level) };
}

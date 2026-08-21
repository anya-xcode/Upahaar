/**
 * Regenerates docs/delhi-coverage.md from the launch data.
 *
 * The coverage map is a business document — which areas we can actually serve,
 * how fast, and where the next seller should be signed — so it is generated
 * from the same source the delivery engine reads. It cannot drift.
 *
 *   npm run docs:delhi
 */
import fs from 'node:fs';
import path from 'node:path';
import { DELHI_PINCODES } from '../server/src/seed/data/delhi.js';
import { DELHI_SELLERS } from '../server/src/seed/data/delhiSellers.js';
import { haversineKm } from '../server/src/services/deliveryEngine.js';

const sellersFor = (code) => DELHI_SELLERS.filter((s) => s.serves.includes(code));

const byDistrict = {};
for (const p of DELHI_PINCODES) (byDistrict[p.district] ||= []).push(p);

const express = DELHI_PINCODES.filter((p) => p.express60Available);
const priority = DELHI_PINCODES.filter((p) => p.priority3hAvailable && !p.express60Available);
const uncovered = DELHI_PINCODES.filter((p) => sellersFor(p.code).length === 0);

let out = `# Delhi coverage

_Generated from \`server/src/seed/data/delhi.js\` and \`delhiSellers.js\`. Run \`npm run docs:delhi\` to refresh._

**${DELHI_PINCODES.length} PIN codes** · **${Object.keys(byDistrict).length} districts** · **${DELHI_SELLERS.length} launch sellers**

| Fastest tier | PIN codes | What it means |
|---|---|---|
| 60 minutes | ${express.length} | Dense inner Delhi — short rider hops, the promise holds |
| 3 hours | ${priority.length} | Wider urban Delhi — Dwarka, Rohini, trans-Yamuna |
| Next day | ${DELHI_PINCODES.length - express.length - priority.length} | Outer belt — reachable, but not same-day |

> Tiers are a **ceiling**, not a guarantee. The live tier is computed per gift from
> seller distance, stock, working hours and preparation time — so a 60-minute area
> still shows "tomorrow" outside trading hours. That is intended.

---

## Seller coverage

| Seller | Base | Radius | PIN codes | Furthest |
|---|---|---|---|---|
`;

for (const s of DELHI_SELLERS) {
  const byCode = Object.fromEntries(DELHI_PINCODES.map((p) => [p.code, p]));
  const furthest = Math.max(
    ...s.serves.map((c) => (byCode[c] ? haversineKm({ lat: s.lat, lng: s.lng }, byCode[c].location) : 0))
  );
  out += `| ${s.businessName} | ${s.pincode} ${byCode[s.pincode]?.area ?? ''} | ${s.radius} km | ${s.serves.length} | ${furthest.toFixed(1)} km |\n`;
}

out += '\n---\n\n## By district\n';

for (const [district, list] of Object.entries(byDistrict)) {
  const ex = list.filter((p) => p.express60Available).length;
  out += `\n### ${district}\n\n_${list.length} PIN codes · ${ex} express-ready_\n\n`;
  out += '| PIN | Area | Fastest tier | Sellers |\n|---|---|---|---|\n';
  for (const p of [...list].sort((a, b) => a.code.localeCompare(b.code))) {
    const n = sellersFor(p.code).length;
    const tier = p.express60Available ? '60 min' : p.priority3hAvailable ? '3 hr' : 'Next day';
    out += `| \`${p.code}\` | ${p.area} | ${tier} | ${n || '**none**'} |\n`;
  }
}

out += '\n---\n\n## Where to sign the next seller\n\n';
if (uncovered.length === 0) {
  out += 'Every Delhi PIN code has at least one seller in range. The next win is **depth, not reach** — a second seller in an area upgrades its fastest tier and adds resilience when one store is closed or out of stock.\n\n';
  const thin = DELHI_PINCODES.filter((p) => sellersFor(p.code).length === 1 && p.express60Available);
  if (thin.length) {
    out += `These ${thin.length} express-ready areas depend on a **single** seller — losing them drops the area to shipped-only:\n\n`;
    for (const t of thin) out += `- \`${t.code}\` ${t.area} (${t.district})\n`;
  }
} else {
  out += `${uncovered.length} PIN codes have no seller in range and fall back to 2–3 day shipping:\n\n`;
  for (const g of uncovered) out += `- \`${g.code}\` ${g.area} (${g.district})\n`;
}

const outPath = path.join(process.cwd(), 'docs', 'delhi-coverage.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`docs/delhi-coverage.md written`);
console.log(`  ${DELHI_PINCODES.length} pincodes · ${DELHI_SELLERS.length} sellers · ${uncovered.length} uncovered`);

/* Tech: the machinery behind an exchange, as solid line art. */
import type { SceneObject } from '../model/types';
import { arrowPoints, beam, box, C, cyl, dots, figure, gearPoints, greyDots, label, onSides, onTop, sample, shape, type V } from './kit';
import type { Entry } from './index';

const base = (w: number, d: number, at: V = [0, -3, 0], h = 3) => box(w, d, h, at, { tier: 'ghost', round: 2, name: 'Base' });

/** A dial's hands: two beams from the centre. */
const hands = (c: V, r: number, a1: number, a2: number, y: number): SceneObject[] => [
  beam([c[0], c[2]], [c[0] + Math.cos(a1) * r * 0.55, c[2] + Math.sin(a1) * r * 0.55], y, 3, { name: 'Hour hand' }),
  beam([c[0], c[2]], [c[0] + Math.cos(a2) * r * 0.82, c[2] + Math.sin(a2) * r * 0.82], y, 2, { name: 'Minute hand' }),
];

export const TECH: Entry[] = [
  {
    id: 'servers',
    title: 'Server rack',
    tags: ['server', 'rack', 'infrastructure', 'uptime'],
    make: () => {
      const out = Array.from({ length: 6 }, (_, i) => {
        const top = i === 5;
        const o = box(110, 76, 16, [0, i * 21, 0], { tier: top ? 'subject' : 'support', shadow: i ? 5 : 0, name: `Unit ${i + 1}` });
        onSides(o, (top ? dots : greyDots)({ spacing: 2.6, size: 0.6, inset: 0, region: { x: 0.12, y: 0.5, w: 0.1, h: 0.45 }, opacity: top ? 1 : 0.4 }), 's2');
        return o;
      });
      return figure('Server rack', out);
    },
  },
  {
    id: 'gpu',
    title: 'GPU compute',
    tags: ['gpu', 'chip', 'compute', 'h100'],
    make: () => {
      const out: SceneObject[] = [base(176, 176, [0, -4, 0], 4), box(104, 104, 8, [0, 0, 0], { tier: 'support', name: 'Package' })];
      const die = box(58, 58, 6, [0, 8, 0], { name: 'Die' });
      onTop(die, dots({ spacing: 2.6, size: 0.7, inset: 3, gradient: { type: 'radial', cx: 0.5, cy: 0.5, radius: 0.75 } }));
      out.push(die);
      for (let i = 0; i < 9; i++) {
        const t = (i - 4) * 10.5;
        out.push(
          box(4, 9, 1.6, [t, 0, 60], { tier: 'ghost', round: 0.3, name: 'Pin' }),
          box(4, 9, 1.6, [t, 0, -60], { tier: 'ghost', round: 0.3, name: 'Pin' }),
          box(9, 4, 1.6, [60, 0, t], { tier: 'ghost', round: 0.3, name: 'Pin' }),
          box(9, 4, 1.6, [-60, 0, t], { tier: 'ghost', round: 0.3, name: 'Pin' }),
        );
      }
      return figure('GPU compute', out, [label('H100', [0, 40, 0])]);
    },
  },
  {
    id: 'network',
    title: 'Network',
    tags: ['network', 'nodes', 'graph', 'distributed'],
    make: () => {
      const out: SceneObject[] = [base(196, 196, [0, -3, 0])];
      const ring: [number, number][] = Array.from({ length: 6 }, (_, i) => [Math.cos((i / 6) * Math.PI * 2 + 0.3) * 74, Math.sin((i / 6) * Math.PI * 2 + 0.3) * 74]);
      ring.forEach((p, i) => {
        out.push(beam([0, 0], p, 8, 3.2, { tier: 'ghost', name: 'Link' }));
        out.push(beam(p, ring[(i + 1) % 6]!, 6, 2.6, { tier: 'ghost', name: 'Link' }));
      });
      ring.forEach((p, i) => out.push(cyl(11, 22, [p[0], 0, p[1]], { tier: 'support', name: `Node ${i + 1}` })));
      const hub = cyl(20, 38, [0, 0, 0], { name: 'Engine', shadow: 8 });
      onTop(hub, dots({ spacing: 2.2, size: 0.6, inset: 1.4 }));
      out.push(hub);
      return figure('Network', out);
    },
  },
  {
    id: 'database',
    title: 'Database',
    tags: ['database', 'storage', 'ledger', 'data'],
    make: () => {
      const out = [0, 1, 2].map(i => {
        const top = i === 2;
        const o = cyl(56, 22, [0, i * 32, 0], { tier: top ? 'subject' : 'support', shadow: i ? 10 : 0, guides: i > 0, name: `Shard ${i + 1}` });
        if (top) onTop(o, dots({ spacing: 3, size: 0.8, inset: 4, gradient: { type: 'radial', cx: 0.5, cy: 0.5, radius: 0.7 } }));
        return o;
      });
      return figure('Database', out);
    },
  },
  {
    id: 'layers',
    title: 'The stack',
    tags: ['stack', 'layers', 'api', 'architecture'],
    make: () => {
      const names = ['LEDGER', 'ENGINE', 'API'];
      const out = names.map((n, i) => {
        const top = i === 2;
        const o = box(150, 150, 10, [0, i * 36, 0], { tier: top ? 'subject' : 'support', shadow: i ? 10 : 0, guides: i > 0, name: n, round: 4 });
        o.decal = { kind: 'text', text: n, paths: [], source: n, x: 0, y: 0, size: 9, rotation: -45, mode: 'fill', color: top ? C.emerald : C.mid, width: null, opacity: 1 };
        return o;
      });
      return figure('The stack', out);
    },
  },
  {
    id: 'vault',
    title: 'Self-custody vault',
    tags: ['vault', 'security', 'custody', 'safe'],
    make: () => {
      const safe = box(110, 110, 100, [0, 0, 0], { name: 'Vault' });
      onSides(safe, greyDots({ spacing: 3, size: 0.55, inset: 0, region: { x: 0.5, y: 0.78, w: 0.32, h: 0.12 } }), 's1');
      const dial = cyl(28, 6, [0, 50, 55], { tier: 'support', rot: [90, 0, 0], name: 'Dial' });
      onTop(dial, dots({ spacing: 2.4, size: 0.6, inset: 2, gradient: { type: 'radial', cx: 0.5, cy: 0.5, radius: 0.8 } }));
      const handle = box(26, 5, 5, [38, 50, 58], { tier: 'support', round: 1, name: 'Handle' });
      return figure('Self-custody vault', [base(150, 150, [0, -3, 0]), safe, dial, handle]);
    },
  },
  {
    id: 'blocks',
    title: 'Blocks',
    tags: ['blockchain', 'blocks', 'chain', 'ledger'],
    make: () => {
      const out: SceneObject[] = [];
      for (let i = 0; i < 5; i++) {
        const last = i === 4;
        const o = box(34, 34, 34, [-104 + i * 52, last ? 14 : 0, 0], { tier: last ? 'subject' : 'support', shadow: last ? 8 : 0, guides: last, name: `Block ${i + 1}` });
        if (last) onTop(o, dots({ spacing: 2.6, size: 0.65, inset: 2 }));
        out.push(o);
        if (i < 4) out.push(box(18, 6, 6, [-78 + i * 52, 14, 0], { tier: 'ghost', round: 1, name: 'Link' }));
      }
      return figure('Blocks', out);
    },
  },
  {
    id: 'wallet',
    title: 'Wallet',
    tags: ['wallet', 'card', 'address', 'account'],
    make: () => {
      const back = box(150, 95, 4, [-14, 0, -26], { tier: 'ghost', name: 'Card behind' });
      const card = box(150, 95, 4, [0, 12, 0], { name: 'Card', shadow: 10, guides: true });
      card.decal = { kind: 'text', text: '0x05a1…c996', paths: [], source: 'address', x: 18, y: 26, size: 5, rotation: -45, mode: 'fill', color: C.mid, width: null, opacity: 1 };
      const chip = box(24, 18, 2, [-40, 16, -18], { name: 'Chip', round: 2 });
      onTop(chip, dots({ spacing: 2, size: 0.5, inset: 1 }));
      return figure('Wallet', [back, card, chip]);
    },
  },
  {
    id: 'terminal',
    title: 'Terminal',
    tags: ['terminal', 'screen', 'monitor', 'trading'],
    make: () => {
      const screen = box(190, 8, 112, [0, 36, 0], { name: 'Screen', round: 3 });
      const curve = sample(x => 0.28 + 0.36 * x + 0.13 * Math.sin(x * 17) + 0.07 * Math.sin(x * 41), 60);
      onSides(screen, dots({ spacing: 3.2, size: 0.8, inset: 7, mask: { mode: 'below', points: curve, alt: C.grey, altOpacity: 0.1 } }), 's2');
      return figure('Terminal', [box(84, 52, 4, [0, 0, 0], { tier: 'support', name: 'Foot' }), box(16, 16, 36, [0, 0, -6], { tier: 'support', name: 'Stand' }), screen]);
    },
  },
  {
    id: 'phone',
    title: 'Phone',
    tags: ['mobile', 'phone', 'app'],
    make: () => {
      const phone = box(78, 9, 156, [0, 0, 0], { name: 'Phone', round: 4 });
      const curve = sample(x => (x < 0.35 ? 0.3 : 0.3 + (x - 0.35) ** 1.4 * 0.75), 30);
      onSides(phone, dots({ spacing: 3, size: 0.75, inset: 8, mask: { mode: 'below', points: curve, alt: C.grey, altOpacity: 0.12 } }), 's2');
      const shadow = box(70, 60, 2, [0, 0, -30], { tier: 'ghost', name: 'Floor' });
      return figure('Phone', [shadow, phone], [label('18×', [30, 170, 4], { size: 5.5, color: C.line })]);
    },
  },
  {
    id: 'gears',
    title: 'Matching engine',
    tags: ['gears', 'engine', 'matching', 'mechanism'],
    make: () => {
      const big = shape(gearPoints(14, 56, 47), 14, [-34, 0, -10], { name: 'Engine', round: 1 });
      onTop(big, dots({ spacing: 3, size: 0.75, inset: 3, gradient: { type: 'radial', cx: 0.5, cy: 0.5, radius: 0.6, invert: true } }));
      const a = (-24 * Math.PI) / 180;
      const small = shape(gearPoints(9, 36, 28), 14, [-34 + Math.cos(a) * 84, 0, -10 + Math.sin(a) * 84], { tier: 'support', name: 'Gear', round: 1, rot: [0, 9, 0] });
      const axle = cyl(10, 22, [-34, 0, -10], { tier: 'support', name: 'Axle' });
      return figure('Matching engine', [big, small, axle]);
    },
  },
  {
    id: 'latency',
    title: 'Low latency',
    tags: ['speed', 'latency', 'fast', 'arrow'],
    make: () => {
      const arrow = shape(arrowPoints(190, 30, 66, 50), 10, [16, 0, 0], { name: 'Arrow', round: 1.2 });
      onTop(arrow, dots({ spacing: 3, size: 0.8, inset: 2.5, gradient: { type: 'linear', angle: 0, start: 0, end: 0.8 } }));
      const out: SceneObject[] = [arrow];
      for (let i = 0; i < 5; i++) out.push(box(3, 40 - i * 6, 22 - i * 3.6, [-96 - i * 12, 0, 0], { tier: i < 2 ? 'support' : 'ghost', round: 0.4, name: `Trail ${i + 1}` }));
      return figure('Low latency', out, [label('<1MS', [70, 34, 0])]);
    },
  },
  {
    id: 'pipeline',
    title: 'Pipeline',
    tags: ['pipeline', 'flow', 'data', 'stages'],
    make: () => {
      const out: SceneObject[] = [base(250, 70)];
      for (let i = 0; i < 3; i++) {
        const last = i === 2;
        const o = box(48, 48, 48, [-90 + i * 90, 0, 0], { tier: last ? 'subject' : 'support', name: `Stage ${i + 1}` });
        if (last) onTop(o, dots({ spacing: 2.8, size: 0.7, inset: 2.4 }));
        out.push(o);
        if (i < 2) out.push(cyl(7, 42, [-66 + i * 90, 24, 0], { tier: 'ghost', rot: [0, 0, -90], name: 'Pipe' }));
      }
      return figure('Pipeline', out);
    },
  },
  {
    id: 'modules',
    title: 'Modules',
    tags: ['modules', 'blocks', 'building', 'composable'],
    make: () => {
      const out: SceneObject[] = [];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          const pick = i === 1 && j === 1;
          const x = (i - 1) * 46;
          const z = (j - 1) * 46;
          const y = pick ? 24 : 0;
          out.push(box(42, 42, 12, [x, y, z], { tier: pick ? 'subject' : 'ghost', shadow: pick ? 10 : 0, guides: pick, name: `Brick ${i * 3 + j + 1}` }));
          for (const [dx, dz] of [
            [-10, -10],
            [10, -10],
            [-10, 10],
            [10, 10],
          ]) {
            const stud = cyl(5.5, 4, [x + dx!, y + 12, z + dz!], { tier: pick ? 'subject' : 'ghost', name: 'Stud' });
            if (pick) onTop(stud, dots({ spacing: 1.7, size: 0.45, inset: 0.6 }));
            out.push(stud);
          }
        }
      return figure('Modules', out);
    },
  },
  {
    id: 'time-zones',
    title: 'Time zones',
    tags: ['clock', 'time zones', 'global', 'markets'],
    make: () => {
      const cities: [string, number, number, number][] = [
        ['NY', -84, 18, -2.2],
        ['LDN', 0, 28, -0.6],
        ['HK', 84, 38, 1.4],
      ];
      const out: SceneObject[] = [];
      const labels = cities.map(([name, x, h, t], i) => {
        const focus = i === 1;
        const dial = cyl(32, h, [x, 0, 0], { tier: focus ? 'subject' : 'support', name });
        out.push(dial, ...hands([x, h, 0], 32, t, t * 2.7 + 1, h));
        const pin = cyl(3, 4, [x, h, 0], { tier: focus ? 'subject' : 'support', name: 'Pin' });
        if (focus) onTop(pin, dots({ spacing: 1.4, size: 0.4, inset: 0.3 }));
        out.push(pin);
        return label(name, [x + 34, 0.2, 40], { plane: 'ground', size: 5 });
      });
      return figure('Time zones', out, labels);
    },
  },
  {
    id: 'cubes',
    title: 'Distributed',
    tags: ['cubes', 'distributed', 'nodes', 'scale'],
    make: () => {
      const out: SceneObject[] = [];
      const s = 26;
      const g = 6;
      for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
          for (let z = 0; z < 3; z++) {
            const lifted = x === 2 && y === 2 && z === 2;
            const o = box(s, s, s, [(x - 1) * (s + g) + (lifted ? 8 : 0), y * (s + g) + (lifted ? 22 : 0), (z - 1) * (s + g) + (lifted ? 8 : 0)], {
              tier: lifted ? 'subject' : y === 2 ? 'support' : 'ghost',
              shadow: lifted ? 10 : y > 0 ? 4 : 0,
              round: 2,
              name: `Node ${x}${y}${z}`,
            });
            if (lifted) onTop(o, dots({ spacing: 2.4, size: 0.6, inset: 2 }));
            out.push(o);
          }
      return figure('Distributed', out);
    },
  },
];

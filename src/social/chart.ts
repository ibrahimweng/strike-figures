/* Charts on a card: a few numbers someone types in, drawn the brand's way.
   Number first; grays with one series in green; tickers in Medium over
   their values in Regular; hairline axes; a source line.

   Kinds: a big number, bars, a histogram, a line, an area, rings (one ring
   per row, concentric), a wheel (segmented radial: petals sized by value)
   and rays (labelled points joined to one hub). */

export type ChartKind = 'number' | 'bars' | 'histogram' | 'line' | 'area' | 'ring' | 'wheel' | 'rays';

export interface ChartRow {
  label: string;
  value: number;
}

export interface ChartSpec {
  kind: ChartKind;
  rows: ChartRow[];
  /** the row drawn in green; null: the largest (bars, wheel, rays), the last (line, area), the first (ring) */
  highlight: number | null;
  /** around each value: "IV " and "%" make "IV 106.2%" */
  prefix: string;
  suffix: string;
  /** decimal places; null: as typed */
  decimals: number | null;
  /** the big number, as written ("81%", "$4.2M"), and what it counts */
  big: string;
  caption: string;
  /** the big number in Geist Pixel Circle */
  pixel: boolean;
  /** data marks in dots instead of solid */
  dots: boolean;
  /** "Source: Strike, Oct 2026" */
  source: string;
  /** rings: the whole each value is a share of (100 for percentages) */
  total: number;
  /** the panel behind the chart: the card's own, or the green gradient */
  panel: 'ground' | 'green';
}

export const CHART_KINDS: { value: ChartKind; label: string; title: string }[] = [
  { value: 'number', label: 'Number', title: 'One big number, and what it counts' },
  { value: 'bars', label: 'Bars', title: 'Values side by side' },
  { value: 'histogram', label: 'Histogram', title: 'How values spread across ranges' },
  { value: 'line', label: 'Line', title: 'A value over time' },
  { value: 'area', label: 'Area', title: 'A value over time, filled' },
  { value: 'ring', label: 'Rings', title: 'Shares of a whole, as concentric rings' },
  { value: 'wheel', label: 'Wheel', title: 'Segments around a center, sized by value' },
  { value: 'rays', label: 'Rays', title: 'Labeled points joined to one hub' },
];

const IV_ROWS: ChartRow[] = [
  { label: 'DELL', value: 551.9 },
  { label: 'AMZN', value: 30 },
  { label: 'MSFT', value: 32 },
  { label: 'LITE', value: 138 },
  { label: 'AAPL', value: 20.5 },
  { label: 'AMD', value: 106.2 },
];

const HOURS: ChartRow[] = ['00', '03', '06', '09', '12', '15', '18', '21'].map((label, i) => ({ label, value: [42, 31, 28, 55, 71, 88, 64, 49][i]! }));

/** Example data for each kind, so a new chart shows something sensible. */
export function exampleChart(kind: ChartKind): Partial<ChartSpec> {
  switch (kind) {
    case 'number':
      return { big: '81%', caption: 'of the week, listed options are closed', rows: [] };
    case 'bars':
      return { rows: HOURS, prefix: '', suffix: '', source: 'Volume by hour, ET. Source: Strike' };
    case 'histogram':
      return {
        rows: ['0–10', '10–20', '20–30', '30–40', '40–50', '50–60', '60+'].map((label, i) => ({ label, value: [4, 11, 19, 24, 15, 8, 3][i]! })),
        prefix: '',
        suffix: '',
        source: 'Implied volatility, % of underlyings',
      };
    case 'line':
    case 'area':
      return { rows: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label, i) => ({ label, value: [12, 18, 16, 27, 33, 41][i]! })), prefix: '$', suffix: 'M', source: 'Monthly volume' };
    case 'ring':
      return { rows: [{ label: 'Closed', value: 81 }, { label: 'Open', value: 19 }], prefix: '', suffix: '%', total: 100, source: 'Share of the week' };
    case 'wheel':
    case 'rays':
      return { rows: IV_ROWS, prefix: 'IV ', suffix: '%', source: '' };
  }
}

export const DEFAULT_CHART: ChartSpec = {
  kind: 'bars',
  rows: HOURS,
  highlight: null,
  prefix: '',
  suffix: '',
  decimals: null,
  big: '81%',
  caption: 'of the week',
  pixel: false,
  dots: false,
  source: '',
  total: 100,
  panel: 'ground',
};

export function fillChart(raw: Partial<ChartSpec> | null | undefined): ChartSpec {
  const c = { ...DEFAULT_CHART, ...(raw ?? {}) };
  c.rows = Array.isArray(c.rows) ? c.rows.filter(r => r && typeof r.label === 'string').map(r => ({ label: r.label, value: Number.isFinite(r.value) ? r.value : 0 })) : [];
  return c;
}

/** A number typed any way: "1,234.5", "$4.2M", "81%", "−3". */
export function parseValue(text: string): number | null {
  const t = text.trim().replace(/[−–]/g, '-').replace(/,/g, '');
  const m = /(-?\d*\.?\d+)\s*([kmb])?/i.exec(t);
  if (!m) return null;
  let v = Number(m[1]);
  const unit = m[2]?.toLowerCase();
  if (unit === 'k') v *= 1e3;
  else if (unit === 'm') v *= 1e6;
  else if (unit === 'b') v *= 1e9;
  return Number.isFinite(v) ? v : null;
}

/** Rows from pasted text: one per line, "label, value" or "label<tab>value" or "label value". */
export function parseRows(text: string): ChartRow[] {
  const out: ChartRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const l = line.trim();
    if (!l) continue;
    const m = /^(.*?)[\t,;:]\s*([^\t,;:]+)$/.exec(l) ?? /^(.*\S)\s+(\S+)$/.exec(l);
    if (!m) continue;
    const v = parseValue(m[2]!);
    if (v === null) continue;
    out.push({ label: m[1]!.trim().replace(/^["']|["']$/g, ''), value: v });
  }
  return out;
}

/** A value as the chart shows it. */
export function formatValue(c: Pick<ChartSpec, 'prefix' | 'suffix' | 'decimals'>, v: number): string {
  const places = c.decimals ?? (Number.isInteger(v) ? 0 : Math.min(2, (String(v).split('.')[1] ?? '').length));
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places });
  return `${v < 0 ? '−' : ''}${c.prefix}${s}${c.suffix}`;
}

/** Which row is drawn in green. */
export function highlightOf(c: ChartSpec): number {
  const n = c.rows.length;
  if (!n) return -1;
  if (c.highlight !== null) return c.highlight >= 0 && c.highlight < n ? c.highlight : -1;
  if (c.kind === 'line' || c.kind === 'area') return n - 1;
  if (c.kind === 'ring') return 0;
  let best = 0;
  c.rows.forEach((r, i) => r.value > c.rows[best]!.value && (best = i));
  return best;
}

/** What's off about a chart's data, in plain words: the brand's data rules. */
export function chartIssues(c: ChartSpec): string[] {
  const out: string[] = [];
  const rows = c.rows;
  if (c.kind === 'number') {
    if (!c.big.trim()) out.push('The big number is empty.');
    else if (!/\d/.test(c.big)) out.push('The big number has no digits.');
    return out;
  }
  if (rows.length < 2) out.push('Add at least two rows.');
  const labels = rows.map(r => r.label.trim().toUpperCase()).filter(Boolean);
  const dup = labels.find((l, i) => labels.indexOf(l) !== i);
  if (dup) out.push(`${dup} appears twice: each one appears once per chart.`);
  if (rows.some(r => !r.label.trim())) out.push('Every row needs a label.');
  if (c.kind === 'ring') {
    const sum = rows.reduce((a, r) => a + r.value, 0);
    if (c.total > 0 && Math.abs(sum - c.total) > c.total * 0.005 && rows.length > 1 && sum <= c.total * 1.5) out.push(`The shares add up to ${formatValue(c, sum)}, not ${formatValue(c, c.total)}.`);
    if (rows.length > 5) out.push('More than five rings get hard to read.');
  }
  if ((c.kind === 'bars' || c.kind === 'histogram') && rows.length > 14) out.push('More than 14 bars get hard to read on a post: group them.');
  if ((c.kind === 'wheel' || c.kind === 'rays') && rows.length > 8) out.push('More than eight segments crowd the wheel.');
  if ((c.kind === 'wheel' || c.kind === 'rays' || c.kind === 'ring' || c.kind === 'bars') && rows.some(r => r.value < 0)) out.push('Negative values can’t be drawn here: use a line.');
  if (rows.length && !c.source.trim() && c.kind !== 'wheel' && c.kind !== 'rays') out.push('Add a source line: where the numbers come from, and when.');
  return out;
}

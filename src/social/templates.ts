/* Posts to start from: the brand book's posters (tagline posters 4.9,
   campaign posters 4.10, the photo cover 1.5), set up as posts. Each fills
   a post's look and words; the words are examples to replace. */
import { presetSpec } from '../pattern/spec';
import { DEFAULT_CHART, exampleChart } from './chart';
import type { PostLayout } from './layout';
import type { Post } from './types';
import { TAGLINE } from './voice';

export interface Template {
  id: string;
  /** where it comes from in the brand book */
  ref: string;
  label: string;
  /** what it suits */
  note: string;
  post: Partial<Post>;
}

const chart = (p: Partial<typeof DEFAULT_CHART>) => ({ ...DEFAULT_CHART, ...p });

export const LAYOUT_OPTIONS: { value: PostLayout; label: string; title: string }[] = [
  { value: 'standard', label: 'Standard', title: 'Words and picture side by side or stacked, logo at the foot' },
  { value: 'tagline', label: 'Tagline', title: 'The picture fills the top; the logo above the words at the foot (brand book 4.9)' },
  { value: 'hero', label: 'Big number', title: 'One huge number, with the words before and after it (brand book 4.10)' },
  { value: 'split', label: 'Split', title: 'The headline in two parts, rays or a picture between (brand book 4.10)' },
  { value: 'card', label: 'Card', title: 'The words on a white card over a screenshot or photo (brand book 4.10)' },
  { value: 'cover', label: 'Cover', title: 'The logo large in the middle, the words small at the foot (brand book 1.5)' },
];

export const TEMPLATES: Template[] = [
  {
    id: 'tagline-blocks',
    ref: '4.9',
    label: 'Tagline, blocks',
    note: 'A line drawing above, the logo and the words at the foot.',
    post: { layout: 'tagline', ground: 'dark', size: 'portrait', visual: 'corner', figure: { kind: 'library', id: 'drawn-mark' }, headline: TAGLINE, sub: '', eyebrow: '', pattern: null },
  },
  {
    id: 'tagline-wheel',
    ref: '4.9',
    label: 'Tagline, wheel',
    note: 'The headline over a chart panel: implied volatility by ticker.',
    post: { layout: 'standard', ground: 'dark', size: 'portrait', side: 'right', visual: 'chart', chart: chart({ kind: 'wheel', ...exampleChart('wheel') }), headline: 'Options on every market, *every hour.*', sub: '', eyebrow: '', pattern: null },
  },
  {
    id: 'tagline-number',
    ref: '4.9',
    label: 'Tagline, pixel number',
    note: 'Light ground, a green panel, one number in Geist Pixel Circle.',
    post: { layout: 'standard', ground: 'light', size: 'portrait', side: 'right', visual: 'chart', chart: chart({ kind: 'number', big: '24%', caption: '', pixel: true, panel: 'green' }), headline: TAGLINE, sub: '', eyebrow: '', pattern: null },
  },
  {
    id: 'campaign-number',
    ref: '4.10',
    label: 'Campaign, big number',
    note: 'One fact, its number huge, hairline bars behind it.',
    post: {
      layout: 'hero',
      ground: 'green',
      size: 'portrait',
      visual: 'chart',
      chart: chart({ kind: 'bars', rows: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, i) => ({ label, value: 30 + ((i * 37) % 50) })), highlight: -1, source: '', pixel: false }),
      headline: 'Listed options are closed *81%* of the week.',
      sub: '',
      eyebrow: '',
      pattern: null,
    },
  },
  {
    id: 'campaign-card',
    ref: '4.10',
    label: 'Campaign, card',
    note: 'A product line on a white card over your screenshot.',
    post: { layout: 'card', ground: 'dark', size: 'portrait', visual: 'screenshot', headline: 'The terminal,', sub: 'rebuilt for options.', eyebrow: '', pattern: presetSpec('discs') },
  },
  {
    id: 'campaign-rays',
    ref: '4.10',
    label: 'Campaign, rays',
    note: 'The tagline split in two, rays from the mark to each ticker.',
    post: { layout: 'split', ground: 'green', size: 'portrait', visual: 'chart', chart: chart({ kind: 'rays', ...exampleChart('rays') }), headline: 'Options on every market, every hour.', sub: '', eyebrow: '', pattern: presetSpec('rings') },
  },
  {
    id: 'cover-photo',
    ref: '1.5',
    label: 'Cover, photo',
    note: 'A photo, the logo large, the tagline small at the foot.',
    post: { layout: 'cover', size: 'landscape', visual: 'photo', headline: TAGLINE, sub: '', eyebrow: '', pattern: null },
  },
  {
    id: 'cover-pattern',
    ref: '1.5',
    label: 'Cover, dots',
    note: 'The logo large on black, a quiet wave of dots behind.',
    post: { layout: 'cover', ground: 'dark', size: 'landscape', visual: 'none', headline: TAGLINE, sub: '', eyebrow: '', pattern: presetSpec('soft-wave') },
  },
];

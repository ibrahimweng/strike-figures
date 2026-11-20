/* Export: SVG (clean and editable: hidden lines cut away, arcs kept as arcs)
   or PNG at 1×, 2× or 4×. The preview is the file itself. */
import { useEffect, useMemo, useState } from 'react';
import { renderScene } from '../engine/render';
import { toSvgString } from '../engine/svg';
import type { Scene } from '../model/types';
import { useStore } from '../model/store';
import { Seg, TextField, Toggle } from './controls';
import { IconDownload } from './icons';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'figure';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function saveFigure(scene: Scene) {
  const data = { app: 'strike-figures', version: 1, figure: scene };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${slug(scene.name)}.figure.json`);
}

export function ExportDialog({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [background, setBackground] = useState(!scene.theme.transparent);
  const [clipHidden, setClipHidden] = useState(true);
  const [shadows, setShadows] = useState(true);
  const [scale, setScale] = useState<'1' | '2' | '4'>('2');
  const [name, setName] = useState(slug(`${scene.label} ${scene.name}`));
  const [copied, setCopied] = useState(false);
  const advanced = useStore(s => s.advanced);
  const model = useMemo(() => renderScene(scene), [scene]);
  const svg = useMemo(() => toSvgString(model, { clipHidden, background, shadows, idPrefix: slug(scene.name) }), [model, clipHidden, background, shadows, scene.name]);
  const { width: W, height: H } = scene.artboard;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const go = async () => {
    if (format === 'svg') download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
    else download(await svgToPng(svg, W, H, Number(scale)), `${name}@${scale}x.png`);
  };

  return (
    <div className="scrim" onPointerDown={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal aria-label="Export">
      <div className="dialog">
        <div className="preview">
          <div className="chk" style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, ${W * 1.4}px)` }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="opts">
          <h2>Export</h2>
          <div className="field-label">Format</div>
          <Seg value={format} options={[{ value: 'svg', label: 'SVG' }, { value: 'png', label: 'PNG' }]} onChange={setFormat} />
          <div className="note">{format === 'svg' ? 'Sharp at any size. Opens in Figma, and drops into a website.' : 'A picture, for slides, chats and docs.'}</div>
          {format === 'png' && (
            <>
              <div className="field-label">Size</div>
              <Seg value={scale} options={[{ value: '1', label: `${W}px` }, { value: '2', label: `${W * 2}px` }, { value: '4', label: `${W * 4}px` }]} onChange={setScale} />
            </>
          )}
          <Toggle on={background} onChange={setBackground}>
            Dark background
          </Toggle>
          {advanced && format === 'svg' && (
            <Toggle on={clipHidden} onChange={setClipHidden}>
              Cut away hidden lines
            </Toggle>
          )}
          {advanced && (
            <Toggle on={shadows} onChange={setShadows}>
              Shadows
            </Toggle>
          )}
          <div className="field-label">File name</div>
          <TextField value={name} onChange={setName} />
          <div className="meta">
            {format === 'png' ? `${W * Number(scale)} × ${H * Number(scale)} px` : `${W} × ${H} · ${(svg.length / 1024).toFixed(1)} KB`}
          </div>
          <button className="btn primary wide" onClick={go} data-testid="export-go">
            <IconDownload /> Download {format.toUpperCase()}
          </button>
          {format === 'svg' && (
            <button
              className="btn soft wide"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(svg);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? 'Copied' : 'Copy SVG code'}
            </button>
          )}
          <button className="btn wide" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

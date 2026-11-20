/* A small Markdown renderer for the skill's own files: headings, paragraphs,
   lists, tables, bold, code and links. Enough for rules written plainly. */
import { Fragment, type ReactNode } from 'react';

function inline(text: string, key = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith('**')) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      out.push(
        <a key={k} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(c => c.trim());

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(4, h[1]!.length + 1);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      blocks.push(<Tag key={i}>{inline(h[2]!, `h${i}`)}</Tag>);
      i++;
      continue;
    }
    if (line.trim().startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('|')) rows.push(lines[i++]!);
      const [head, , ...body] = rows;
      blocks.push(
        <div className="md-table" key={`t${i}`}>
          <table>
            <thead>
              <tr>{cells(head ?? '').map((c, k) => <th key={k}>{inline(c, `th${i}${k}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, n) => (
                <tr key={n}>{cells(r).map((c, k) => <td key={k}>{inline(c, `td${i}${n}${k}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(\[[ x]\]\s+)?(.*)$/;
    if (li.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: ReactNode[] = [];
      while (i < lines.length && li.test(lines[i]!)) {
        const m = li.exec(lines[i]!)!;
        items.push(<li key={i}>{inline(m[4]!, `li${i}`)}</li>);
        i++;
      }
      blocks.push(ordered ? <ol key={`o${i}`}>{items}</ol> : <ul key={`u${i}`}>{items}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s)/.test(lines[i]!)) para.push(lines[i++]!);
    blocks.push(<p key={`p${i}`}>{inline(para.join(' '), `p${i}`)}</p>);
  }
  return <Fragment>{blocks}</Fragment>;
}

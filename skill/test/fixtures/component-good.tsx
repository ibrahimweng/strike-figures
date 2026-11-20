import { useState } from 'react';

// A primary button: green with ground text.
export function Hero({ title }: { title: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const ready = open && title.length < 60;
  return (
    <section className="bg-ground text-ink">
      <h1 className="strike-h1">Options that never close</h1>
      <p className="text-ink-2">{ready ? title : 'Hedge when it happens.'}</p>
      <button className="bg-green text-ground rounded-md" style={{ borderRadius: 8 }} onClick={() => setOpen(!open)}>
        Join the waitlist
      </button>
      <a href="#fees">Fees</a>
    </section>
  );
}

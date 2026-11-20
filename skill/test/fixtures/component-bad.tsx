import { useState } from 'react';

const plans = [{ title: 'Guaranteed yield', currency: 'USD' }];

export function Hero() {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <section className="bg-zinc-800 text-white rounded-[10px]">
      <h1 className="strike-h1">The fastest, most reliable options exchange anywhere in the world today</h1>
      <button style={{ background: '#10B981', color: '#fff', borderRadius: 4, fontFamily: 'Inter' }} onClick={() => setOpen(!open)}>
        Trade now!
      </button>
      <div className="bg-emerald-500 text-white">Primary</div>
      {open && <p>Join STRIKE today.</p>}
    </section>
  );
}

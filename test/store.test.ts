import { describe, expect, it } from 'vitest';
import { LIBRARY, libraryScene } from '../src/library';
import { dedupe, fillScene, useStore } from '../src/model/store';

describe('store', () => {
  it('starts with the Strike mark, and none of Linear\'s figures', () => {
    const st = useStore.getState();
    expect(st.scenes.map(s => s.preset)).toEqual(['strike']);
  });

  it('undoes and redoes a change, and a drag undoes as one step', () => {
    const st = useStore.getState();
    const before = st.scene().camera.yaw;
    st.update(s => void (s.camera.yaw = 10), 'drag-a');
    st.update(s => void (s.camera.yaw = 20), 'drag-a');
    st.update(s => void (s.camera.yaw = 30), 'drag-a');
    expect(useStore.getState().scene().camera.yaw).toBe(30);
    useStore.getState().undo();
    expect(useStore.getState().scene().camera.yaw).toBe(before);
    useStore.getState().redo();
    expect(useStore.getState().scene().camera.yaw).toBe(30);
  });

  it('adds a shape beside the others rather than inside them', () => {
    const st = useStore.getState();
    st.setActive(st.scenes[0]!.id);
    st.add('cylinder');
    const sc = useStore.getState().scene();
    const added = sc.objects[sc.objects.length - 1]!;
    expect(Math.hypot(added.position[0], added.position[2])).toBeGreaterThan(100);
    expect(useStore.getState().selection.objectId).toBe(added.id);
  });

  it('repeats an object in a row', () => {
    const st = useStore.getState();
    const sc = st.scene();
    st.select(sc.objects[0]!.id);
    st.repeat(3, [0, 0, 10], 2);
    expect(useStore.getState().scene().objects.length).toBe(sc.objects.length + 3);
  });

  it('fills in fields a figure saved by an older version lacks', () => {
    const sc = fillScene({ name: 'Old', objects: [{ name: 'Box', shape: { kind: 'box', width: 10, depth: 10, radius: 0 }, height: 5 } as never] });
    expect(sc.objects[0]!.style.creaseTrim).toBeNull();
    expect(sc.objects[0]!.faces.top).toEqual({ fill: null, dots: null });
    expect(sc.theme.creaseTrim).toBe(4);
  });

  it("turns the sun mark of earlier versions into the Strike logo", () => {
    const old = { kind: 'sunset', text: '', paths: [], source: 'Sun', x: 1.16, y: 1.16, size: 109.54, rotation: -45, mode: 'stroke', color: null, width: null, opacity: 1 };
    const sc = fillScene({ objects: [{ name: 'Slab', shape: { kind: 'box', width: 10, depth: 10, radius: 0 }, height: 5, decal: old } as never] });
    expect(sc.objects[0]!.decal?.kind).toBe('strike');
  });

  it('resets the card it was asked to, not the figure that is open', () => {
    useStore.getState().importScene(libraryScene(LIBRARY[0]!.id)!);
    const st = useStore.getState();
    const [a, b] = st.scenes;
    st.setActive(a!.id);
    useStore.getState().update(s => void (s.camera.yaw = 12));
    useStore.getState().resetPreset(b!.id);
    const after = useStore.getState();
    expect(new Set(after.scenes.map(s => s.id)).size).toBe(after.scenes.length);
    expect(after.scenes.find(s => s.id === a!.id)!.camera.yaw).toBe(12);
    expect(after.scenes.find(s => s.id === b!.id)!.preset).toBe(b!.preset);
    expect(after.activeId).toBe(b!.id);
  });

  it('gives figures saved under one id ids of their own', () => {
    const one = fillScene({ id: 'x', name: 'One' });
    const two = fillScene({ id: 'x', name: 'Two' });
    const out = dedupe([one, two]);
    expect(out[0]!.id).toBe('x');
    expect(out[1]!.id).not.toBe('x');
  });
});

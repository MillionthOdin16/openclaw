// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import './resizable-divider.ts';

describe('ResizableDivider', () => {
  it('should have accessibility attributes', async () => {
    const el = document.createElement('resizable-divider');
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-label')).toBe('Resize sidebar');
    expect(el.getAttribute('aria-valuenow')).toBe('0.6');
    expect(el.getAttribute('aria-valuemin')).toBe('0.4');
    expect(el.getAttribute('aria-valuemax')).toBe('0.7');

    el.setAttribute('splitRatio', '0.5');
    await el.updateComplete;
    expect(el.getAttribute('aria-valuenow')).toBe('0.5');

    el.setAttribute('minRatio', '0.3');
    await el.updateComplete;
    expect(el.getAttribute('aria-valuemin')).toBe('0.3');

    el.setAttribute('maxRatio', '0.8');
    await el.updateComplete;
    expect(el.getAttribute('aria-valuemax')).toBe('0.8');

    document.body.removeChild(el);
  });

  it('should handle keyboard events', async () => {
    const el = document.createElement('resizable-divider');
    // @ts-ignore
    el.splitRatio = 0.6;
    document.body.appendChild(el);
    await el.updateComplete;

    const listener = vi.fn();
    el.addEventListener('resize', listener);

    // ArrowLeft should decrease splitRatio
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    // We expect the resize event to be called
    expect(listener).toHaveBeenCalled();
    const event1 = listener.mock.calls[0][0] as CustomEvent;
    expect(event1.detail.splitRatio).toBeLessThan(0.6);

    // ArrowRight should increase splitRatio
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(listener).toHaveBeenCalledTimes(2);
    const event2 = listener.mock.calls[1][0] as CustomEvent;
    expect(event2.detail.splitRatio).toBeGreaterThan(0.6); // Assuming it calculates from current state 0.6

    document.body.removeChild(el);
  });
});

/**
 * Dev-only shim: deliver ResizeObserver callbacks on the next animation frame.
 *
 * Virtualized components that measure their own rows (e.g. the Massdriver
 * plugin's log viewer, built on react-logviewer/virtua) legitimately resize
 * elements from inside ResizeObserver callbacks. Browsers cap same-frame
 * redelivery and emit the benign "ResizeObserver loop completed with
 * undelivered notifications" error; Next.js-style dev overlays filter it, but
 * rspack's dev-server overlay surfaces every occurrence as a full-screen
 * runtime error. Deferring callbacks one frame breaks the same-frame loop, so
 * the browser never emits the error in the first place.
 *
 * Applied only in development — production builds have no overlay and the
 * warning is invisible there.
 */
export const installRafResizeObserver = () => {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof window === 'undefined' || !window.ResizeObserver) return;

  const NativeResizeObserver = window.ResizeObserver;

  window.ResizeObserver = class RafResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      let frame = 0;
      super((entries, observer) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => callback(entries, observer));
      });
    }
  };
};

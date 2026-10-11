import { useCallback, useEffect, useRef } from "react";

/**
 * Horizontal drag-to-explore for RTL tracks.
 * Works with mouse drag on desktop and native touch scrolling on mobile.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return; // let the browser handle touch
    const el = ref.current;
    if (!el) return;
    state.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false };
    el.classList.add("is-dragging");
  }, []);

  const endDrag = useCallback(() => {
    const el = ref.current;
    state.current.down = false;
    el?.classList.remove("is-dragging");
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !state.current.down) return;
    const delta = e.clientX - state.current.startX;
    if (Math.abs(delta) > 4) state.current.moved = true;
    el.scrollLeft = state.current.startScroll - delta;
  }, []);

  useEffect(() => {
    const stop = () => endDrag();
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [endDrag]);

  const preventClickAfterDrag = useCallback((e: React.MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerLeave: endDrag,
      onClickCapture: preventClickAfterDrag,
    },
  };
}

export default useDragScroll;

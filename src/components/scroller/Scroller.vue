<template>
  <div
    class="scrollbar-y"
    tabIndex="-1"
    :style="{
      height: containerHeight + 'px',
      overflow: 'scroll',
      position: 'absolute',
      right: 0,
      top: 0,
      width: scrollbarSize + 'px',
      willChange: 'transform',
    }"
    @scroll="handleScrollY"
    ref="verticalScrollRef"
  >
    <div
      :style="{
        position: 'absolute',
        height: estimatedTotalHeight + 'px',
        width: 1 + 'px',
      }"
    ></div>
  </div>
  <div
    class="scrollbar-x"
    tabIndex="-1"
    :style="{
      overflow: 'scroll',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: containerWidth + 'px',
      height: scrollbarSize + 'px',
      willChange: 'transform',
    }"
    @scroll="handleScrollX"
    ref="horizontalScrollRef"
  >
    <div
      :style="{
        position: 'absolute',
        width: estimatedTotalWidth + 'px',
        height: 1 + 'px',
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { Direction } from '@/enums/direction';
import { Position } from '@/types/position';
import { debounce } from 'lodash';
import { ref } from 'vue';

// ==== Props ==== //
const props = withDefaults(defineProps<{
  containerHeight: number;
  containerWidth: number;
  estimatedTotalHeight: number;
  estimatedTotalWidth: number;
  scrollbarSize?: number;
}>(), {
  scrollbarSize: 13,
});
// ================ //

// ==== Model ==== //
const isScrolling = defineModel<boolean>('isScrolling', { required: false, default: false });
const scrollTop = defineModel<number>('scrollTop', { required: false, default: 0 });
const scrollLeft = defineModel<number>('scrollLeft', { required: false, default: 0 });
const verticalScrollDirection = defineModel<Direction>('verticalScrollDirection', { required: false, default: Direction.Up });
const horizontalScrollDirection = defineModel<Direction>('horizontalScrollDirection', { required: false, default: Direction.Left });
// ================ //

// ==== Emits ==== //
const emit = defineEmits<{
  (e: 'onScroll', event: { scrollTop: number, scrollLeft: number }): void
}>();
// ================ //

// ==== Refs ==== //
const verticalScrollRef = ref<HTMLDivElement>();
const horizontalScrollRef = ref<HTMLDivElement>();
// ================ //

// ==== Data ==== //
let isRendering = null;
const touchState = {
  lastX: null as number | null,
  lastY: null as number | null,
  activeId: null as number | null,
  inertiaRaf: null as number | null,
  samples: [] as Array<{ dx: number; dy: number; t: number }>,
};
// ================ //

// ==== Constants ==== //
const INERTIA_DECEL = 0.002; // lower deceleration for longer glide (px/ms^2)
const INERTIA_MIN_SPEED = 0.01; // px/ms stop threshold
const TOUCH_VELOCITY_WINDOW_MS = 120; // window for velocity sampling
const FRAME_DT_CAP_MS = 32; // cap long frames
// ================ //

// ==== Methods ==== //
const debouncedCancelScrolling = debounce(() => cancelScrolling(), 150);
const setScrolling = (value: boolean) => {
  isScrolling.value = value;
};

const cancelScrolling = () => {
  setScrolling(false);
};

const handleScrollY = (e: Event) => {
  const { scrollTop: localScrollTop } = e.target as HTMLDivElement;

  setScrolling(true);
  verticalScrollDirection.value =
      scrollTop.value > localScrollTop ? Direction.Up : Direction.Down,
  scrollTop.value = localScrollTop;

  /* Scroll callbacks */
  emit('onScroll', { scrollTop: scrollTop.value, scrollLeft: scrollLeft.value });

  /* Reset isScrolling if required */
  debouncedCancelScrolling();
};

const handleScrollX = (e: Event) => {
  const { scrollLeft: eventScrollLeft } = e.target as HTMLDivElement;
  
  setScrolling(true);
  horizontalScrollDirection.value =
      scrollLeft.value > eventScrollLeft ? Direction.Left : Direction.Right,
  scrollLeft.value = eventScrollLeft;

  /* Scroll callbacks */
  emit('onScroll', { scrollLeft: scrollLeft.value, scrollTop: scrollTop.value });

  /* Reset isScrolling if required */
  debouncedCancelScrolling();
};

const scrollTo = ({ y, x }: Position) => {
  if (horizontalScrollRef.value && x !== 0)
    horizontalScrollRef.value.scrollLeft = x;
  if (verticalScrollRef.value && y !== 0)
    verticalScrollRef.value.scrollTop = y;
};

const scrollToTop = () => {
  scrollTo({ y: 0 });
};

const scrollToBottom = () => {
  scrollTo({ y: props.estimatedTotalHeight - props.containerHeight });
};

const scrollToLeft = () => {
  scrollTo({ x: 0 });
};

const scrollToRight = () => {
  scrollTo({ x: props.estimatedTotalWidth - props.containerWidth });
};

const scrollToStart = () => {
  scrollTo({ y: 0, x: 0 });
};

const onWheel = (event: WheelEvent) => {
  stopInertia();
  if (isRendering) return;
  const { deltaX, deltaY, deltaMode } = event;
  let dx = event.shiftKey ? deltaY : deltaX;
  let dy = deltaY;

  /* Scroll only in one direction */
  const isHorizontal = event.shiftKey || Math.abs(dx) > Math.abs(dy);

  if (deltaMode === 1) dy = dy * props.scrollbarSize;
  const currentScroll = isHorizontal
    ? horizontalScrollRef.value?.scrollLeft
    : verticalScrollRef.value?.scrollTop;
  isRendering = window.requestAnimationFrame(() => {
    isRendering = null;
    if (isHorizontal) {
      if (horizontalScrollRef.value)
        horizontalScrollRef.value.scrollLeft = currentScroll + dx;
    } else {
      if (verticalScrollRef.value)
        verticalScrollRef.value.scrollTop = currentScroll + dy;
    }
  });
};

const addTouchSample = (dx: number, dy: number) => {
  const now = performance.now();
  touchState.samples.push({ dx, dy, t: now });
  const cutoff = now - TOUCH_VELOCITY_WINDOW_MS;
  while (touchState.samples.length > 0 && touchState.samples[0].t < cutoff) touchState.samples.shift();
}

const computeVelocity = () => {
  const now = performance.now();
  const recent = touchState.samples.filter(s => now - s.t <= TOUCH_VELOCITY_WINDOW_MS);
  if (!recent.length) return { vx: 0, vy: 0 };
  const first = recent[0];
  const last = recent[recent.length - 1];
  const totalDx = recent.reduce((acc, s) => acc + s.dx, 0);
  const totalDy = recent.reduce((acc, s) => acc + s.dy, 0);
  const dt = Math.max(1, last.t - first.t);
  return { vx: totalDx / dt, vy: totalDy / dt };
}

const onTouchStart = (event: TouchEvent) => {
  stopInertia();
  if (event.touches.length > 0) {
    const touch = event.touches[0];
    touchState.activeId = touch.identifier;
    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;
    touchState.samples = [];
  }
};

const onTouchEnd = (_event: TouchEvent) => {
  touchState.activeId = null;
  touchState.lastX = null;
  touchState.lastY = null;
  const { vx, vy } = computeVelocity();
  if (Math.abs(vx) < INERTIA_MIN_SPEED && Math.abs(vy) < INERTIA_MIN_SPEED) return;
  startInertia(vx, vy);
};

const onTouchMove = (event: TouchEvent) => {
  if (isRendering) return;
  const touch = Array.from(event.touches).find(t => t.identifier === touchState.activeId) || event.touches[0];
  if (!touch) return;

  if (touchState.lastX == null || touchState.lastY == null) {
    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;
    return;
  }

  const dx = touchState.lastX - touch.clientX; // moving finger right should scroll right
  const dy = touchState.lastY - touch.clientY; // moving finger down should scroll down

  touchState.lastX = touch.clientX;
  touchState.lastY = touch.clientY;

  addTouchSample(dx, dy);

  const currentScrollLeft = horizontalScrollRef.value?.scrollLeft ?? 0;
  const currentScrollTop = verticalScrollRef.value?.scrollTop ?? 0;

  event.preventDefault();

  isRendering = window.requestAnimationFrame(() => {
    isRendering = null;
    if (horizontalScrollRef.value)
      horizontalScrollRef.value.scrollLeft = currentScrollLeft + dx;
    if (verticalScrollRef.value)
      verticalScrollRef.value.scrollTop = currentScrollTop + dy;
  });
};

const startInertia = (initialVx: number, initialVy: number) => {
  const decel = INERTIA_DECEL;
  const minSpeed = INERTIA_MIN_SPEED;
  let vx = initialVx;
  let vy = initialVy;
  let prev = performance.now();

  setScrolling(true);

  const step = () => {
    const now = performance.now();
    const dt = Math.min(FRAME_DT_CAP_MS, now - prev); // cap large frames
    prev = now;

    // Update velocities with deceleration towards 0
    if (vx > 0) vx = Math.max(0, vx - decel * dt); else vx = Math.min(0, vx + decel * dt);
    if (vy > 0) vy = Math.max(0, vy - decel * dt); else vy = Math.min(0, vy + decel * dt);

    // Apply displacement
    const dx = vx * dt;
    const dy = vy * dt;
    const maxX = Math.max(0, props.estimatedTotalWidth - props.containerWidth);
    const maxY = Math.max(0, props.estimatedTotalHeight - props.containerHeight);

    if (horizontalScrollRef.value) {
      const next = Math.min(maxX, Math.max(0, (horizontalScrollRef.value.scrollLeft ?? 0) + dx));
      // If we hit a bound, zero the velocity on that axis
      if (next === 0 || next === maxX) vx = 0;
      horizontalScrollRef.value.scrollLeft = next;
    }
    if (verticalScrollRef.value) {
      const next = Math.min(maxY, Math.max(0, (verticalScrollRef.value.scrollTop ?? 0) + dy));
      if (next === 0 || next === maxY) vy = 0;
      verticalScrollRef.value.scrollTop = next;
    }

    const stillMoving = Math.abs(vx) > minSpeed || Math.abs(vy) > minSpeed;
    if (stillMoving) {
      touchState.inertiaRaf = requestAnimationFrame(step);
    } else {
      touchState.inertiaRaf = null;
      debouncedCancelScrolling();
    }
  };

  touchState.inertiaRaf = requestAnimationFrame(step);
};

const stopInertia = () => {
  if (touchState.inertiaRaf != null) {
    cancelAnimationFrame(touchState.inertiaRaf);
    touchState.inertiaRaf = null;
  }
};
// ================ //

// ==== Expose ==== //
defineExpose({
  scrollTo,
  scrollToTop,
  scrollToBottom,
  scrollToLeft,
  scrollToRight,
  scrollToStart,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
});
// ================ //
</script>
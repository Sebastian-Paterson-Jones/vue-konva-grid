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
});
// ================ //
</script>
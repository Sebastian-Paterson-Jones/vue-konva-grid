import { ref, Ref } from "vue";
import Scroller from "@/components/scroller/Scroller.vue";
import { Direction } from "@/enums/direction";

export const useScroller = ({
  scrollerRef,
}: {
  scrollerRef: Ref<InstanceType<typeof Scroller>>;
}) => {
  // ==== Data ==== //
  const scrollTop = ref(0);
  const scrollLeft = ref(0);
  const isScrolling = ref(false);
  const horizontalScrollDirection = ref<Direction>(Direction.Right);
  const verticalScrollDirection = ref<Direction>(Direction.Down);
  // ================ //

  // ==== Methods ==== //
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    scrollerRef.value?.onWheel(event);
  };
  // ================ //

  return {
    scrollTop,
    scrollLeft,
    isScrolling,
    horizontalScrollDirection,
    verticalScrollDirection,
    onWheel
  }
}
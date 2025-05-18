<template>
  <v-image 
    :config="{
      x: x,
      y: y,
      height: height,
      width: width,
      image: image,
      ...propsRest
    }"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useImage } from "../../composables/useImage";
import { ImageProps } from "./types";

// ==== props ==== //
const props = withDefaults(defineProps<ImageProps>(), {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
// ================ //

// ==== composables ==== //
const { image, width: imageWidth, height: imageHeight, status } = useImage({
  url: props.url,
});
// ================ //

// ==== methods ==== //
const getAspectRatio = (width: number, height: number) => {
  return Math.min((props.width - props.spacing) / width, (props.height - props.spacing) / height);
};
// ================ //

// ==== computed ==== //
const propsRest = computed(() => {
  const {
    url,
    width = 0,
    height = 0,
    x = 0,
    y = 0,
    spacing = 1,
    ...rest
  } = props;
  return {
    ...rest,
    spacing: spacing || 1,
  };
});
const aspectRatio = computed(() => {
  return getAspectRatio(props.width, props.height);
});
const y = computed(() => {
  return props.y + props.spacing;
});
const x = computed(() => {
  return props.x + props.spacing;
});
const height = computed(() => {
  return Math.min(imageHeight.value, aspectRatio.value * imageHeight.value);
});
const width = computed(() => {
  return Math.min(imageWidth.value, aspectRatio.value * imageWidth.value);
});
// ================ //
</script>
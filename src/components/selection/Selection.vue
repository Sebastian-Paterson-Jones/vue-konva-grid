<template>
  <HtmlBox
    v-bind="props"
  />
</template>

<script setup lang="ts">
import { SelectionProps } from "../../types";
import HtmlBox from "../html-box/HtmlBox.vue";

const props = withDefaults(defineProps<SelectionProps>(), {
  strokeWidth: 1,
});
</script>
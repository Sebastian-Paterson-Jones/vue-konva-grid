<template>
  <Grid 
    :row-count="1000"
    :column-count="1000"
    :frozen-columns="1"
    :frozen-rows="1"
  />
</template>

<script setup>
import Grid from './components/grid/Grid.vue';
</script>


<style scoped>
</style>

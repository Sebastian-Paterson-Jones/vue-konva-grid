<template>
  <Grid 
    :width="400"
    :height="600"
    :rows-count="1000"
    :columns-count="1000"
    :columns-frozen="0"
    :rows-frozen="0"
    :get-row-height="() => 30"
    :get-column-width="() => 60"
  />
</template>

<script setup>
import Grid from './components/grid/new-grid/Grid.vue';
</script>


<style scoped>
</style>

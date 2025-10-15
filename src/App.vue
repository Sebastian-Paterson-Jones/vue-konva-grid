<template>
  <Grid 
    :width="200"
    :height="300"
    :rows-count="1000"
    :columns-count="16"
    :columns-frozen="2"
    :rows-frozen="1"
    :get-row-height="() => 30"
    :get-column-width="() => 60"
  />
</template>

<script setup>
import Grid from './components/grid/new-grid/Grid.vue';
</script>


<style scoped>
</style>

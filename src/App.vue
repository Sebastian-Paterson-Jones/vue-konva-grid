<template>
  <Grid 
    :height="800"
    :width="900"
    :rows-count="1000"
    :columns-count="16"
    :columns-frozen="2"
    :rows-frozen="1"
    :get-row-height="() => 20"
    :get-column-width="() => 40"
  />
</template>

<script setup>
import Grid from './components/grid/new-grid/Grid.vue';
</script>


<style scoped>
</style>

<template>
  <Grid 
    :height="250"
    :width="250"
    :rows-count="35"
    :columns-count="25"
    :columns-frozen="1"
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

<template>
  <Grid 
    :rows-count="1000"
    :columns-count="1000"
    :columns-frozen="1"
    :rows-frozen="1"
    :get-row-height="() => 60"
    :get-column-width="() => 100"
  />
</template>

<script setup>
import Grid from './components/grid/new-grid/Grid.vue';
</script>


<style scoped>
</style>

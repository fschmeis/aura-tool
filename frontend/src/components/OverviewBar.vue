<template>
  <div class="flex items-center justify-between p-4 bg-white border-b">
    <div class="flex items-center gap-4 flex-wrap">
      <slot />
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Simple wrapper to keep overview layout identical across analysis types
</script>

<style scoped>
/* intentionally minimal; styling done via slots */
</style>

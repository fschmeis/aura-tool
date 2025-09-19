<template>
  <div class="mb-4 flex items-center">
    <div class="flex-1 text-sm">
      <slot />
    </div>
    <div class="ml-2">
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

<template>
  <aside class="w-80 border-r bg-white flex flex-col">
    <div class="flex-1 overflow-y-auto p-4">
      <EventLog :events="events" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import EventLog from './EventLog.vue';

interface Props {
  events: any[];
}

defineProps<Props>();
</script>

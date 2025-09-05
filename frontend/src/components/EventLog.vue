<template>
  <aside class="w-80 min-h-screen flex flex-col bg-white border-r shadow p-4 text-xs">
    <div class="flex items-center justify-between mb-2">
      <h2 class="font-bold text-base text-blue-900">Event Log</h2>
      <button @click="$props.onOpenLogfile" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200">Open Log</button>
    </div>
    <div v-if="!events.length" class="text-gray-400">No events yet</div>
    <ul class="flex-1 overflow-y-auto">
      <li v-for="(event, i) in events" :key="i" class="mb-3 pb-2 border-b last:border-b-0">
        <span class="block font-mono text-gray-700">{{ event.timestamp }}</span>
        <span :class="eventClass(event)">{{ event.message }}</span>
        <div v-if="event.details" class="text-gray-500 break-all mt-1">{{ event.details }}</div>
      </li>
    </ul>
  </aside>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    events: {
      type: Array as PropType<Array<{ timestamp: string; message: string; type: string; details?: string }>>,
      required: true
    },
    onOpenLogfile: {
      type: Function,
      required: true
    }
  },
  methods: {
    eventClass(event: any) {
      if (event.type === 'error') return 'text-red-600';
      if (event.type === 'success') return 'text-green-700';
      if (event.type === 'info') return 'text-blue-700';
      return '';
    }
  }
});
</script>

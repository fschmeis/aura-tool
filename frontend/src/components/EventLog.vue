<template>
  <div class="w-full text-xs h-full max-h-full flex flex-col">
    <div class="flex items-center justify-between mb-2 gap-2">
      <h2 class="font-bold text-base text-blue-900">Event Log</h2>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" @click="handleOpenLogfile">Open Log</Button>
        <Button size="sm" variant="destructive" @click="handleClearLog">Clear Log</Button>
      </div>
    </div>
    <div v-if="!events.length" class="text-gray-400">No events yet</div>
  <ul class="flex-1 overflow-y-auto font-mono min-h-0">
    <li v-for="(event, i) in events" :key="i" class="mb-3 pb-2 border-b last:border-b-0 flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <div>
            <span v-if="event.type === 'success'" class="w-2.5 h-2.5 inline-block bg-green-500 rounded-full"></span>
            <span v-else-if="event.type === 'error'" class="w-2.5 h-2.5 inline-block bg-red-500 rounded-full"></span>
            <span v-else class="w-2.5 h-2.5 inline-block bg-blue-500 rounded-full"></span>
          </div>
          <span class="text-gray-500">{{ event.timestamp ? event.timestamp.slice(11, 19) : '' }}</span>
        </div>
        <span :class="eventClass(event)">{{ event.message }}</span>
        <div v-if="event.details" class="text-gray-500 break-all mt-1">{{ event.details }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { Button } from './ui/button';
import { openLogfile } from '../utils/logUtils';

const props = defineProps({
  events: {
    type: Array as PropType<Array<{ timestamp: string; message: string; type: string; details?: string }>>,
    required: true
  }
});

async function handleOpenLogfile() {
  await openLogfile();
}

async function handleClearLog() {
  await fetch('/api/logfile', { method: 'DELETE' });
}

function eventClass(event: any) {
  if (event.type === 'error') return 'text-red-600';
  if (event.type === 'success') return 'text-green-700';
  if (event.type === 'info') return 'text-blue-700';
  return '';
}
</script>

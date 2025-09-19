import { onMounted, onUnmounted, ref } from 'vue';
import { fetchLog } from '@/utils/logUtils';

export function useEventLog(pollMs = 1000) {
  const events = ref<any[]>([]);
  let timer: any = null;

  async function update() {
    events.value = await fetchLog();
  }

  onMounted(() => {
    update();
    timer = setInterval(update, pollMs);
  });
  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return { events, update };
}

export async function fetchLog() {
  const res = await fetch('/api/logfile');
  const text = await res.text();
  return text.trim().split('\n').map(line => {
    try {
      const entry = JSON.parse(line);
      let type = 'info';
      let message = entry.action;
      if (entry.action?.includes('error') || entry.error) type = 'error';
      if (entry.action?.includes('success')) type = 'success';
      if (entry.action === 'clone' && entry.success) type = 'success';
      if (entry.action === 'clone' && !entry.success) type = 'error';
      if (entry.action === 'lint-exec' || entry.action === 'llm-success') type = 'info';
      if (entry.action === 'lint-success' || entry.action === 'llm-success') type = 'success';
      if (entry.action === 'lint-error' || entry.action === 'llm-error') type = 'error';
      if (entry.action === 'openfolder-error' || entry.action === 'openlogdir-error') type = 'error';
      if (entry.action === 'openfolder-success' || entry.action === 'openlogdir-success') type = 'success';
      return {
        timestamp: entry.timestamp,
        message,
        type,
        details: entry.details || entry.error || ''
      };
    } catch {
      return { timestamp: '', message: line, type: 'error' };
    }
  }).reverse();
}

export function openLogfile() {
  window.open('/api/logfile', '_blank');
}

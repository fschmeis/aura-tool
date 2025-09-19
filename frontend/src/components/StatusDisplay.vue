<template>
  <div v-if="hasError || isLoading || showSuccess" class="mb-4">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center gap-2 px-4 py-3 rounded bg-blue-50 border border-blue-200">
      <div class="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      <span class="text-blue-700 text-sm">{{ loadingMessage || 'Processing...' }}</span>
    </div>
    
    <!-- Success state -->
    <div v-else-if="showSuccess" class="flex items-center justify-between px-4 py-3 rounded bg-green-50 border border-green-200">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span class="text-green-700 text-sm">{{ successMessage }}</span>
      </div>
      <button 
        @click="$emit('clearSuccess')" 
        class="text-green-500 hover:text-green-700 text-sm font-medium"
      >
        Dismiss
      </button>
    </div>
    
    <!-- Error state -->
    <div v-else-if="hasError" class="flex items-center justify-between px-4 py-3 rounded bg-red-50 border border-red-200">
      <div class="flex items-center gap-2">
        <svg class="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="text-red-700 text-sm">{{ errorMessage }}</span>
      </div>
      <button 
        @click="$emit('clearError')" 
        class="text-red-500 hover:text-red-700 text-sm font-medium"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasError: boolean;
  errorMessage: string;
  isLoading: boolean;
  loadingMessage?: string;
  showSuccess: boolean;
  successMessage: string;
}>();

defineEmits<{
  clearError: [];
  clearSuccess: [];
}>();
</script>

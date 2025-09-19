import { ref } from 'vue';

export interface StatusState {
  hasError: boolean;
  errorMessage: string;
  isLoading: boolean;
  showSuccess: boolean;
  successMessage: string;
}

export function useStatusHandling() {
  const statusState = ref<StatusState>({
    hasError: false,
    errorMessage: '',
    isLoading: false,
    showSuccess: false,
    successMessage: ''
  });

  function clearAll() {
    statusState.value = {
      hasError: false,
      errorMessage: '',
      isLoading: false,
      showSuccess: false,
      successMessage: ''
    };
  }

  function clearError() {
    statusState.value.hasError = false;
    statusState.value.errorMessage = '';
  }

  function clearSuccess() {
    statusState.value.showSuccess = false;
    statusState.value.successMessage = '';
  }

  function setError(message: string) {
    statusState.value = {
      hasError: true,
      errorMessage: message,
      isLoading: false,
      showSuccess: false,
      successMessage: ''
    };
  }

  function setSuccess(message: string) {
    statusState.value = {
      hasError: false,
      errorMessage: '',
      isLoading: false,
      showSuccess: true,
      successMessage: message
    };
  }

  function setLoading(loading: boolean) {
    statusState.value.isLoading = loading;
    if (loading) {
      statusState.value.hasError = false;
      statusState.value.errorMessage = '';
      statusState.value.showSuccess = false;
      statusState.value.successMessage = '';
    }
  }

  async function handleAsyncOperation<T>(
    operation: () => Promise<T>,
    loadingMessage?: string,
    successMessage?: string
  ): Promise<T | null> {
    try {
      setLoading(true);
      const result = await operation();
      clearAll();
      if (successMessage) {
        setSuccess(successMessage);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    statusState,
    clearAll,
    clearError,
    clearSuccess,
    setError,
    setSuccess,
    setLoading,
    handleAsyncOperation
  };
}

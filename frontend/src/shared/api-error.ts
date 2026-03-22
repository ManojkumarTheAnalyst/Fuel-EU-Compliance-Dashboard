import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (error.response?.status === 400) return 'Bad request — check inputs or compliance state.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Request failed';
}

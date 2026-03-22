import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const httpClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

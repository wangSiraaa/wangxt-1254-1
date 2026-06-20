import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  },
);

export default request;

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request.get<T>(url, config).then((res) => res.data),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    request.post<T>(url, data, config).then((res) => res.data),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    request.put<T>(url, data, config).then((res) => res.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request.delete<T>(url, config).then((res) => res.data),
};

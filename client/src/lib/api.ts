import axios, { AxiosInstance } from "axios";

// Custom interface for the API client that reflects our response interceptor
export interface ApiClient extends AxiosInstance {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}`,
}) as ApiClient;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // If the response follows our { ok, data, message } structure
    if (response.data && typeof response.data === "object" && "ok" in response.data) {
      if (response.data.ok === false) {
        return Promise.reject(response.data);
      }
      return response.data.data; // Return only the payload
    }
    return response.data;
  },
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export const apiClient = api;
export default api;

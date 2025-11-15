import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';

const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-api.com/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            useAuthStore.getState().setTokens(data.token, data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${data.token}`;

            return this.client(originalRequest);
          } catch (refreshError) {
            useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async register(email: string, password: string, name: string) {
    const { data } = await this.client.post('/auth/register', { email, password, name });
    return data;
  }

  async loginWithGoogle(idToken: string) {
    const { data } = await this.client.post('/auth/google', { idToken });
    return data;
  }

  async logout() {
    const { data } = await this.client.post('/auth/logout');
    return data;
  }

  async getProfile() {
    const { data } = await this.client.get('/auth/profile');
    return data;
  }

  // Task endpoints
  async getTasks(params?: { startDate?: string; endDate?: string }) {
    const { data } = await this.client.get('/tasks', { params });
    return data;
  }

  async getTask(id: string) {
    const { data } = await this.client.get(`/tasks/${id}`);
    return data;
  }

  async createTask(task: any) {
    const { data } = await this.client.post('/tasks', task);
    return data;
  }

  async updateTask(id: string, updates: any) {
    const { data } = await this.client.patch(`/tasks/${id}`, updates);
    return data;
  }

  async deleteTask(id: string) {
    const { data } = await this.client.delete(`/tasks/${id}`);
    return data;
  }

  async toggleTaskCompletion(id: string) {
    const { data } = await this.client.patch(`/tasks/${id}/toggle`);
    return data;
  }

  // Calendar endpoints
  async syncCalendar() {
    const { data } = await this.client.post('/calendar/sync');
    return data;
  }

  async connectGoogleCalendar(authCode: string) {
    const { data } = await this.client.post('/calendar/google/connect', { authCode });
    return data;
  }

  // Geofence endpoints
  async getGeofences() {
    const { data } = await this.client.get('/geofences');
    return data;
  }

  async createGeofence(geofence: any) {
    const { data } = await this.client.post('/geofences', geofence);
    return data;
  }

  async deleteGeofence(id: string) {
    const { data } = await this.client.delete(`/geofences/${id}`);
    return data;
  }

  // Sync endpoint
  async sync(changes: any) {
    const { data } = await this.client.post('/sync', changes);
    return data;
  }
}

export const apiService = new ApiService();

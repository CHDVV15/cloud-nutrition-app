import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../firebase';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Auth endpoints
  verifyToken: (token: string) => 
    api.post('/auth/verify', { token }),

  getUserProfile: (uid: string) => 
    api.get(`/auth/user/${uid}`),

  updateUserGoals: (uid: string, goals: any) => 
    api.put(`/auth/user/${uid}/goals`, goals),

  // Meal endpoints
  logMeal: (data: { food_items: string; date?: string }) => 
    api.post('/log_meal', data),

  getUserMeals: (userId: string, date?: string) => 
    api.get(`/meals/${userId}`, { params: { date } }),

  getDailySummary: (userId: string, date?: string) => 
    api.get(`/summary/${userId}`, { params: { date } }),

  getNutritionSummary: (userId: string, date?: string) => 
    api.get('/nutrition_summary', { params: { user_id: userId, date } }),

  getMealRecommendations: (userId: string, date?: string) => 
    api.get('/recommend_next_meal', { params: { user_id: userId, date } }),

  // Health check
  healthCheck: () => 
    api.get('/health'),
};

export default api; 
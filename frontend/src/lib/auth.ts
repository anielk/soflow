import { apiClient } from './api';

export class AuthService {
  static async login(email: string, password: string) {
    try {
      const response = await apiClient.post<{ access_token: string }>('/api/v1/auth/login', {
        email,
        password,
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(email: string, password: string) {
    try {
      const response = await apiClient.post('/api/v1/auth/register', {
        email,
        password,
      });
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
}
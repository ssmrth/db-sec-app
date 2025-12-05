import axios from 'axios';

// API base URL - adjust based on your backend port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for our data structures
export interface Attack {
  id: string;
  timestamp: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  payload: string;
  collection: string;
  detected: boolean;
  description: string;
}

export interface DashboardMetrics {
  attacksToday: number;
  totalAttacks: number;
  recentAttacksCount: number;
  systemHealth: 'critical' | 'warning' | 'healthy';
  topAttackType: string;
  apiUsageToday: number;
  apiUsageRemaining: number;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface AlertRecipient {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'security_analyst' | 'developer' | 'viewer';
  isActive: boolean;
  permissions: {
    receiveAlerts: boolean;
    viewReports: boolean;
    manageAlerts: boolean;
    manageSettings: boolean;
  };
  createdAt: Date;
  lastNotified: Date | null;
}

export interface Report {
  filename: string;
  timestamp: number;
  date: Date;
  size: number;
  path: string;
}

export interface SystemSetting {
  value: any;
  category: string;
  description: string;
  updatedAt: Date;
}

export interface DetailedAttack {
  id: string;
  timestamp: Date;
  collection: string;
  attackType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  payload: any;
  payloadString: string;
  description: string;
  blocked: boolean;
}

// Dashboard API calls
export const dashboardApi = {
  // Get dashboard metrics
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get('/api/dashboard/metrics');
    return response.data;
  },

  // Get recent attacks
  getRecentAttacks: async (limit = 20, page = 1): Promise<{
    attacks: Attack[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get(`/api/dashboard/attacks/recent?limit=${limit}&page=${page}`);
    return response.data;
  },

  // Get analytics data
  getAnalytics: async (days = 7): Promise<{
    timeline: Array<{ time: Date; attacks: number }>;
    attackTypes: Array<{ name: string; value: number }>;
    severity: Array<{ name: string; value: number }>;
  }> => {
    const response = await api.get(`/api/dashboard/analytics/timeline?days=${days}`);
    return response.data;
  },
};

// Vulnerable app API calls (for demonstrating attacks)
export const vulnerableApi = {
  // Product search (vulnerable to injection)
  searchProducts: async (query: string): Promise<{
    products: Product[];
    total: number;
    query: any;
  }> => {
    const response = await api.get(`/api/vulnerable/products/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // User login (vulnerable to auth bypass)
  login: async (credentials: { username: string; password: any }): Promise<{
    success: boolean;
    message: string;
    user?: { username: string; role: string };
    token?: string;
  }> => {
    const response = await api.post('/api/vulnerable/auth/login', credentials);
    return response.data;
  },

  // User profile lookup (vulnerable to injection)
  getUser: async (userId: string): Promise<{
    user?: User;
    users?: User[];
    message?: string;
  }> => {
    const response = await api.get(`/api/vulnerable/users/${encodeURIComponent(userId)}`);
    return response.data;
  },

  // Product filtering (vulnerable to injection)
  filterProducts: async (filters: Record<string, any>): Promise<{
    products: Product[];
    appliedFilters: any;
    message: string;
  }> => {
    const response = await api.get('/api/vulnerable/products/filter', { params: filters });
    return response.data;
  },

  // Get all products (safe)
  getProducts: async (): Promise<{
    products: Product[];
    total: number;
  }> => {
    const response = await api.get('/api/vulnerable/products');
    return response.data;
  },

  // Get categories (safe)
  getCategories: async (): Promise<{
    categories: string[];
  }> => {
    const response = await api.get('/api/vulnerable/categories');
    return response.data;
  },
};

// Alert Recipients API
export const alertsApi = {
  // Get all recipients
  getRecipients: async (): Promise<{ recipients: AlertRecipient[] }> => {
    const response = await api.get('/api/alerts/recipients');
    return response.data;
  },

  // Add new recipient
  addRecipient: async (recipient: Partial<AlertRecipient>): Promise<{ recipient: AlertRecipient; message: string }> => {
    const response = await api.post('/api/alerts/recipients', recipient);
    return response.data;
  },

  // Update recipient
  updateRecipient: async (id: string, updates: Partial<AlertRecipient>): Promise<{ recipient: AlertRecipient; message: string }> => {
    const response = await api.put(`/api/alerts/recipients/${id}`, updates);
    return response.data;
  },

  // Delete recipient
  deleteRecipient: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/alerts/recipients/${id}`);
    return response.data;
  },

  // Check permissions
  checkPermissions: async (): Promise<{ canViewReports: boolean; canManageAlerts: boolean }> => {
    const response = await api.get('/api/alerts/permissions');
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  // Get all reports
  getReports: async (): Promise<{ reports: Report[]; total: number }> => {
    const response = await api.get('/api/reports');
    return response.data;
  },

  // Download report
  downloadReport: (filename: string): string => {
    return `${API_BASE_URL}/api/reports/download/${filename}`;
  },

  // Delete report
  deleteReport: async (filename: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/reports/${filename}`);
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  // Get all settings
  getSettings: async (): Promise<{ settings: Record<string, SystemSetting> }> => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  // Update setting
  updateSetting: async (key: string, value: any, category?: string, description?: string): Promise<{ setting: any; message: string }> => {
    const response = await api.put(`/api/settings/${key}`, { value, category, description });
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  // Get detailed attacks for analytics
  getDetailedAttacks: async (limit = 50, page = 1): Promise<{
    attacks: DetailedAttack[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get(`/api/analytics/attacks?limit=${limit}&page=${page}`);
    return response.data;
  },
};

// Demo functions for generating fake attacks
export const demoApi = {
  // Simulate various attack patterns
  simulateAuthBypass: () => vulnerableApi.login({
    username: 'admin',
    password: { $ne: null }
  }),

  simulateComplexInjection: () => vulnerableApi.searchProducts(
    JSON.stringify({ $where: "function() { return true; }" })
  ),

  simulateDataExfiltration: () => vulnerableApi.getUser(
    JSON.stringify({ $ne: null })
  ),

  simulateFilterInjection: () => vulnerableApi.filterProducts({
    price: { $gt: 0 },
    category: { $ne: null }
  }),

  // Generate multiple attacks for demo
  simulateAttackWave: async () => {
    const attacks = [
      () => demoApi.simulateAuthBypass(),
      () => demoApi.simulateComplexInjection(),
      () => demoApi.simulateDataExfiltration(),
      () => demoApi.simulateFilterInjection(),
    ];

    for (const attack of attacks) {
      try {
        await attack();
        // Wait a bit between attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log('Demo attack completed:', error);
      }
    }
  }
};

export default api;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth API
  async login(payload: any) {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  
  async register(payload: any) {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  
  async verifyOtp(otp: string) {
    return fetchWithAuth('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp })
    });
  },

  async resetPassword(payload: any) {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Customers API
  async getCustomers(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/customers?${query}`);
  },

  async getCustomerById(id: string) {
    return fetchWithAuth(`/customers/${id}`);
  },

  async createCustomer(payload: any) {
    return fetchWithAuth('/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateCustomer(id: string, payload: any) {
    return fetchWithAuth(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteCustomer(id: string) {
    return fetchWithAuth(`/customers/${id}`, {
      method: 'DELETE'
    });
  },

  // Products API
  async getProducts(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/products?${query}`);
  },

  async getProductById(id: string) {
    return fetchWithAuth(`/products/${id}`);
  },

  async createProduct(payload: any) {
    return fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateProduct(id: string, payload: any) {
    return fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteProduct(id: string) {
    return fetchWithAuth(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Reminders API
  async getReminders(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/reminders?${query}`);
  },

  async triggerReminderCheck() {
    return fetchWithAuth('/reminders/trigger-check', {
      method: 'POST'
    });
  },

  async updateReminderStatus(id: number, status: string, log?: string) {
    return fetchWithAuth(`/reminders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, log })
    });
  },

  async snoozeReminder(id: number, days: number = 3) {
    return fetchWithAuth(`/reminders/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  },

  // Notifications API
  async getNotifications(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/notifications?${query}`);
  },

  async getNotificationPreviews(customerId: string) {
    return fetchWithAuth(`/notifications/previews?customerId=${customerId}`);
  },

  async sendSimulatedNotification(id: number) {
    return fetchWithAuth(`/notifications/${id}/send`, {
      method: 'POST'
    });
  },

  // Dashboard API
  async getDashboardStats() {
    return fetchWithAuth('/dashboard/stats');
  },

  // AI API
  async getAiRecommendations(customerId: string) {
    return fetchWithAuth(`/ai/recommendations/${customerId}`);
  },

  // Admin API
  async getAdminSettings() {
    return fetchWithAuth('/admin/settings');
  },

  async updateAdminSettings(settings: any[]) {
    return fetchWithAuth('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  },

  async getAdminUsers() {
    return fetchWithAuth('/admin/users');
  },

  async updateAdminUserRole(id: number, payload: any) {
    return fetchWithAuth(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async getAdminAuditLogs() {
    return fetchWithAuth('/admin/audit-logs');
  },

  // Reports API Download Link Helper
  getReportDownloadUrl(type: string, format: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return `${API_BASE_URL}/reports/download?type=${type}&format=${format}&token=${token}`;
  }
};

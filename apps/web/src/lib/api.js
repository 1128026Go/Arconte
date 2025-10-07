const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...authHeaders(),
});

const parseJson = async (response, errorCode) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorCode);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

// ===========================================
// Authentication
// ===========================================
export const auth = {
  login: async (email, password) => {
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJson(response, 'login_failed');

    if (data?.token) {
      localStorage.setItem('token', data.token);
    }

    return data;
  },

  register: async (name, email, password, password_confirmation) => {
    const response = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });

    const data = await parseJson(response, 'register_failed');

    if (data?.token) {
      localStorage.setItem('token', data.token);
    }

    return data;
  },

  logout: async () => {
    try {
      await fetch(`${BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeaders(),
      });
    } finally {
      localStorage.removeItem('token');
    }
  },

  me: async () => {
    const response = await fetch(`${BASE}/auth/me`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'me_failed');
  },

  isAuthenticated: () => {
    return Boolean(localStorage.getItem('token'));
  }
};

// ===========================================
// Cases
// ===========================================
export const cases = {
  getAll: async (params = {}) => {
    const response = await fetch(`${BASE}/cases${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'cases_list_failed');
  },

  getById: async (id) => {
    const response = await fetch(`${BASE}/cases/${id}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'case_get_failed');
  },

  create: async (radicado) => {
    const response = await fetch(`${BASE}/cases`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ radicado }),
    });

    return parseJson(response, 'case_create_failed');
  },

  markRead: async (id) => {
    const response = await fetch(`${BASE}/cases/${id}/read`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'case_mark_read_failed');
  }
};

// ===========================================
// Documents
// ===========================================
export const documents = {
  getAll: async (params = {}) => {
    const response = await fetch(`${BASE}/documents${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'documents_list_failed');
  },

  getById: async (id) => {
    const response = await fetch(`${BASE}/documents/${id}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'document_get_failed');
  },

  upload: async (formData) => {
    const response = await fetch(`${BASE}/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });

    return parseJson(response, 'documents_upload_failed');
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE}/documents/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'document_update_failed');
  },

  delete: async (id) => {
    const response = await fetch(`${BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    return parseJson(response, 'documents_delete_failed');
  },

  download: async (id) => {
    const response = await fetch(`${BASE}/documents/${id}/download`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('document_download_failed');
    }

    return response.blob();
  },

  share: async (id, data) => {
    const response = await fetch(`${BASE}/documents/${id}/share`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'document_share_failed');
  },

  versions: async (id) => {
    const response = await fetch(`${BASE}/documents/${id}/versions`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'document_versions_failed');
  }
};

// ===========================================
// Reminders
// ===========================================
export const reminders = {
  getAll: async (params = {}) => {
    const response = await fetch(`${BASE}/reminders${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'reminders_list_failed');
  },

  getById: async (id) => {
    const response = await fetch(`${BASE}/reminders/${id}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'reminder_get_failed');
  },

  create: async (data) => {
    const response = await fetch(`${BASE}/reminders`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'reminder_create_failed');
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE}/reminders/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'reminder_update_failed');
  },

  delete: async (id) => {
    const response = await fetch(`${BASE}/reminders/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    return parseJson(response, 'reminder_delete_failed');
  },

  markComplete: async (id) => {
    const response = await fetch(`${BASE}/reminders/${id}/complete`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'reminder_complete_failed');
  },

  upcoming: async () => {
    const response = await fetch(`${BASE}/reminders/upcoming`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'reminders_upcoming_failed');
  },

  overdue: async () => {
    const response = await fetch(`${BASE}/reminders/overdue`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'reminders_overdue_failed');
  }
};

// ===========================================
// Billing
// ===========================================
export const billing = {
  getInvoices: async (params = {}) => {
    const response = await fetch(`${BASE}/billing/invoices${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'billing_list_failed');
  },

  getInvoice: async (id) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'invoice_get_failed');
  },

  createInvoice: async (data) => {
    const response = await fetch(`${BASE}/billing/invoices`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'invoice_create_failed');
  },

  updateInvoice: async (id, data) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'invoice_update_failed');
  },

  deleteInvoice: async (id) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    return parseJson(response, 'invoice_delete_failed');
  },

  generatePdf: async (id) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}/pdf`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('invoice_pdf_failed');
    }

    return response.blob();
  },

  sendEmail: async (id, data) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}/send-email`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'invoice_send_failed');
  },

  markPaid: async (id, data) => {
    const response = await fetch(`${BASE}/billing/invoices/${id}/mark-paid`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'invoice_mark_paid_failed');
  },

  getStatistics: async (params = {}) => {
    const response = await fetch(`${BASE}/billing/statistics${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'billing_statistics_failed');
  }
};

// ===========================================
// Time Tracking
// ===========================================
export const timeTracking = {
  getAll: async (params = {}) => {
    const response = await fetch(`${BASE}/time-tracking${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'time_entries_list_failed');
  },

  create: async (data) => {
    const response = await fetch(`${BASE}/time-tracking`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'time_entry_create_failed');
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE}/time-tracking/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'time_entry_update_failed');
  },

  delete: async (id) => {
    const response = await fetch(`${BASE}/time-tracking/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    return parseJson(response, 'time_entry_delete_failed');
  },

  start: async (data) => {
    const response = await fetch(`${BASE}/time-tracking/start`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'time_start_failed');
  },

  stop: async () => {
    const response = await fetch(`${BASE}/time-tracking/stop`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'time_stop_failed');
  },

  current: async () => {
    const response = await fetch(`${BASE}/time-tracking/current`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'time_current_failed');
  },

  reports: async (params = {}) => {
    const response = await fetch(`${BASE}/time-tracking/reports${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'time_reports_failed');
  }
};

// ===========================================
// Jurisprudence
// ===========================================
export const jurisprudence = {
  search: async (params = {}) => {
    const response = await fetch(`${BASE}/jurisprudence/search${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'jurisprudence_search_failed');
  },

  getById: async (id) => {
    const response = await fetch(`${BASE}/jurisprudence/${id}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'jurisprudence_get_failed');
  },

  create: async (data) => {
    const response = await fetch(`${BASE}/jurisprudence`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'jurisprudence_create_failed');
  },

  update: async (id, data) => {
    const response = await fetch(`${BASE}/jurisprudence/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });

    return parseJson(response, 'jurisprudence_update_failed');
  },

  delete: async (id) => {
    const response = await fetch(`${BASE}/jurisprudence/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    return parseJson(response, 'jurisprudence_delete_failed');
  },

  favorite: async (id) => {
    const response = await fetch(`${BASE}/jurisprudence/${id}/favorite`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'jurisprudence_favorite_failed');
  },

  similar: async (id) => {
    const response = await fetch(`${BASE}/jurisprudence/${id}/similar`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'jurisprudence_similar_failed');
  }
};

// ===========================================
// Analytics
// ===========================================
export const analytics = {
  dashboard: async (params = {}) => {
    const response = await fetch(`${BASE}/analytics/dashboard${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'analytics_dashboard_failed');
  },

  cases: async (params = {}) => {
    const response = await fetch(`${BASE}/analytics/cases${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'analytics_cases_failed');
  },

  billing: async (params = {}) => {
    const response = await fetch(`${BASE}/analytics/billing${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'analytics_billing_failed');
  },

  time: async (params = {}) => {
    const response = await fetch(`${BASE}/analytics/time${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'analytics_time_failed');
  },

  documents: async (params = {}) => {
    const response = await fetch(`${BASE}/analytics/documents${buildQuery(params)}`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'analytics_documents_failed');
  },

  export: async (format = 'pdf') => {
    const response = await fetch(`${BASE}/analytics/export?format=${format}`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('analytics_export_failed');
    }

    return response.blob();
  }
};

// ===========================================
// Notifications
// ===========================================
export const notifications = {
  getAll: async () => {
    const response = await fetch(`${BASE}/notifications`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'notifications_list_failed');
  },

  getUnread: async () => {
    const response = await fetch(`${BASE}/notifications/unread`, {
      headers: authHeaders(),
    });

    return parseJson(response, 'notifications_unread_failed');
  },

  markAsRead: async (id) => {
    const response = await fetch(`${BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'notification_mark_read_failed');
  },

  markAllAsRead: async () => {
    const response = await fetch(`${BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: authHeaders(),
    });

    return parseJson(response, 'notification_mark_all_read_failed');
  },

  getStats: async () => {
    try {
      const response = await fetch(`${BASE}/notifications/stats`, {
        headers: authHeaders(),
      });

      return await parseJson(response, 'notification_stats_failed');
    } catch (error) {
      console.warn('Falling back to empty notification stats', error);
      return {
        unread: 0,
        high_priority: 0,
        today: 0,
      };
    }
  }
};

// ===========================================
// Legacy compatibility exports
// ===========================================
export const login = auth.login;
export const logout = auth.logout;
export const me = auth.me;
export const isAuthenticated = auth.isAuthenticated;
export const listCases = cases.getAll;
export const getCase = cases.getById;
export const createCase = cases.create;
export const markRead = cases.markRead;
export const listDocuments = documents.getAll;
export const uploadDocument = documents.upload;
export const deleteDocument = documents.delete;
export const listReminders = reminders.getAll;
export const createReminder = reminders.create;
export const completeReminder = reminders.markComplete;
export const listTimeEntries = timeTracking.getAll;
export const listInvoices = billing.getInvoices;
export const searchJurisprudence = jurisprudence.search;
export const getAnalyticsDashboard = analytics.dashboard;
export const getAllNotifications = notifications.getAll;
export const getUnreadNotifications = notifications.getUnread;
export const markAsRead = notifications.markAsRead;
export const markAllAsRead = notifications.markAllAsRead;
export const getNotificationStats = notifications.getStats;

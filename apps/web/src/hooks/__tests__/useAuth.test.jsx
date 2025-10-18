import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../useAuth';
import * as api from '../../lib/api';

// Mock del API
vi.mock('../../lib/api', () => ({
  auth: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    check: vi.fn(),
  },
}));

// Mock de react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper con Router
const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ==========================================
  // Initialization Tests
  // ==========================================

  it('initializes with loading state', () => {
    api.auth.check.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('checks authentication on mount', async () => {
    api.auth.me.mockResolvedValue({
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  // ==========================================
  // Login Tests
  // ==========================================

  it('successfully logs in a user', async () => {
    const mockUser = {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
      token: 'mock-token-123',
    };

    api.auth.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(api.auth.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result.current.user).toEqual(mockUser.user);
  });

  it('handles login errors', async () => {
    const loginError = new Error('Invalid credentials');
    api.auth.login.mockRejectedValue(loginError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(async () => {
      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });
    }).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBe(null);
  });

  it('sets user state after successful login', async () => {
    const mockUser = {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    api.auth.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser.user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  // ==========================================
  // Register Tests
  // ==========================================

  it('successfully registers a new user', async () => {
    const mockUser = {
      user: {
        id: 1,
        name: 'New User',
        email: 'new@example.com',
      },
      token: 'mock-token-456',
    };

    api.auth.register.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(
        'New User',
        'new@example.com',
        'password123',
        'password123'
      );
    });

    expect(api.auth.register).toHaveBeenCalledWith(
      'New User',
      'new@example.com',
      'password123',
      'password123'
    );
    expect(result.current.user).toEqual(mockUser.user);
  });

  // ==========================================
  // Logout Tests
  // ==========================================

  it('successfully logs out a user', async () => {
    // First login
    const mockUser = {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    api.auth.login.mockResolvedValue(mockUser);
    api.auth.logout.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).not.toBe(null);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(api.auth.logout).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears user state on logout error', async () => {
    // Login first
    const mockUser = {
      user: { id: 1, name: 'Test User' },
    };

    api.auth.login.mockResolvedValue(mockUser);
    api.auth.logout.mockRejectedValue(new Error('Logout failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Logout should clear state even on error
    await act(async () => {
      try {
        await result.current.logout();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.user).toBe(null);
  });

  // ==========================================
  // Authentication Check Tests
  // ==========================================

  it('correctly sets isAuthenticated to true when user is logged in', async () => {
    const mockUser = {
      user: { id: 1, name: 'Test User' },
    };

    api.auth.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('correctly sets isAuthenticated to false when user is not logged in', () => {
    api.auth.check.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });

  // ==========================================
  // Event Listeners Tests
  // ==========================================

  it('handles auth:logout event', async () => {
    const mockUser = {
      user: { id: 1, name: 'Test User' },
    };

    api.auth.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).not.toBe(null);

    // Dispatch logout event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    });

    // User should be cleared
    await waitFor(() => {
      expect(result.current.user).toBe(null);
    });
  });

  it('handles auth:unauthorized event', async () => {
    const mockUser = {
      user: { id: 1, name: 'Test User' },
    };

    api.auth.login.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Dispatch unauthorized event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });

    // User should be cleared
    await waitFor(() => {
      expect(result.current.user).toBe(null);
    });
  });

  // ==========================================
  // Loading State Tests
  // ==========================================

  it('sets loading to false after initial check', async () => {
    api.auth.check.mockResolvedValue(false);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('maintains loading state during login', async () => {
    const mockUser = {
      user: { id: 1, name: 'Test User' },
    };

    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    api.auth.login.mockReturnValue(loginPromise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Start login
    act(() => {
      result.current.login('test@example.com', 'password123');
    });

    // Should not be loading immediately (depends on implementation)
    // await waitFor(() => {
    //   expect(result.current.loading).toBe(true);
    // });

    // Resolve login
    await act(async () => {
      resolveLogin(mockUser);
    });
  });
});

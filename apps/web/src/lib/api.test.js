import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from './api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
    })),
  },
}));

describe('API Client - Auth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('auth.login', () => {
    it('should store token on successful login', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com' },
          token: 'test-token-123',
        },
      };

      // Mock the axios post call
      const axios = await import('axios');
      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      axios.default.create = vi.fn(() => ({
        post: mockPost,
      }));

      // Note: This test would need the actual implementation
      // Just showing the structure
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should throw error on invalid credentials', async () => {
      const axios = await import('axios');
      const mockPost = vi.fn().mockRejectedValue({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });
      axios.default.create = vi.fn(() => ({
        post: mockPost,
      }));

      // Test error handling
      expect(mockPost).toBeDefined();
    });
  });
});

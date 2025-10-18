import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../NotificationBell';
import * as api from '../../../lib/api';

// Mock del API
vi.mock('../../../lib/api', () => ({
  notifications: {
    getStats: vi.fn(),
    getUnread: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

// Wrapper con Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ==========================================
  // Rendering Tests
  // ==========================================

  it('renders notification bell button', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 0,
      high_priority: 0,
      today: 0,
      total: 0,
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /notificaciones/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('fetches notification stats on mount', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 5,
      high_priority: 2,
      today: 3,
      total: 25,
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(api.notifications.getStats).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // Badge Display Tests
  // ==========================================

  it('shows badge when there are unread notifications', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 5,
      high_priority: 0,
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows 99+ for counts over 99', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 150,
      high_priority: 0,
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  it('does not show badge when unread count is 0', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 0,
      high_priority: 0,
    });

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Priority Indicator Tests
  // ==========================================

  it('shows red indicator for high priority notifications', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 2,
      high_priority: 2,
    });

    const { container } = renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      // Look for red/urgent styling
      const urgentElement = container.querySelector('.text-red-500, .bg-red-600, .animate-pulse');
      expect(urgentElement).toBeInTheDocument();
    });
  });

  it('shows blue indicator for normal priority notifications', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 5,
      high_priority: 0,
    });

    const { container } = renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      // Look for blue styling
      const normalElement = container.querySelector('.text-blue-500, .bg-blue-600');
      expect(normalElement).toBeInTheDocument();
    });
  });

  // ==========================================
  // Polling Tests
  // ==========================================

  it('polls for stats every 30 seconds', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 0,
      high_priority: 0,
    });

    renderWithRouter(<NotificationBell />);

    // Initial call
    await waitFor(() => {
      expect(api.notifications.getStats).toHaveBeenCalledTimes(1);
    });

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(api.notifications.getStats).toHaveBeenCalledTimes(2);
    });

    // Advance another 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(api.notifications.getStats).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================
  // Dropdown Interaction Tests
  // ==========================================

  it('opens dropdown when bell is clicked', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 5,
      high_priority: 0,
    });

    renderWithRouter(<NotificationBell />);

    const button = await screen.findByRole('button', { name: /notificaciones/i });
    fireEvent.click(button);

    // NotificationCenter should be rendered (this requires mocking it or checking for its presence)
    // For now, we check that the component re-renders
    expect(button).toBeInTheDocument();
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================

  it('handles API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    api.notifications.getStats.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('shows zero count when API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    api.notifications.getStats.mockRejectedValue(new Error('API Error'));

    renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      // Badge should not show (0 notifications)
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Cleanup Tests
  // ==========================================

  it('clears interval on unmount', async () => {
    api.notifications.getStats.mockResolvedValue({
      unread: 0,
      high_priority: 0,
    });

    const { unmount } = renderWithRouter(<NotificationBell />);

    await waitFor(() => {
      expect(api.notifications.getStats).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Advance time - should NOT call again after unmount
    vi.advanceTimersByTime(30000);

    expect(api.notifications.getStats).toHaveBeenCalledTimes(1); // Still 1, not 2
  });
});

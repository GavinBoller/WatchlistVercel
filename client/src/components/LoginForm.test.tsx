import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { UserResponse } from '@shared/schema';

const mockLogin = jest.fn();
const mockOnLoginSuccess = jest.fn();
const mockOnSwitchToRegister = jest.fn();

jest.mock('@/hooks/use-jwt-auth', () => ({
  useJwtAuth: () => ({
    login: mockLogin,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form and submits', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { username: 'testuser' } as UserResponse }),
    });

    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />,
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password');
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({ username: 'testuser' });
    });
  });
});

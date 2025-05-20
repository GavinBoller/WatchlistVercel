import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

jest.mock('@/hooks/use-jwt-auth');

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockOnLoginSuccess = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  beforeEach(() => {
    (useJwtAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
  });

  test('renders login form and submits', async () => {
    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
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
    });
  });
});

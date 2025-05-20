import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';
import { useJwtAuth } from '@/hooks/use-jwt-auth';

jest.mock('@/hooks/use-jwt-auth');

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockOnLoginSuccess = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  beforeEach(() => {
    (useJwtAuth as jest.Mock).mockReturnValue({ login: mockLogin });
  });

  test('renders login form and submits', async () => {
    render(
      <LoginForm
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByText('Login'));

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password');
  });
});

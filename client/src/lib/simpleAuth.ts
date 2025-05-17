import { UserResponse } from '@shared/schema';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to safely parse response text
async function safeParseResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonData = await response.json();
        if (jsonData.error) return jsonData.error;
        if (jsonData.message) return jsonData.message;
        return JSON.stringify(jsonData);
      } catch (e) {
        console.error('[AUTH] Failed to parse JSON response:', e);
        return 'Failed to parse server response';
      }
    }
    const text = await response.text();
    return text.slice(0, 100) + (text.length > 100 ? '...' : '');
  } catch (e) {
    console.error('[AUTH] Failed to read response:', e);
    return 'Error reading server response';
  }
}

/**
 * Simple login function using Passport's local strategy
 */
export async function login({ username, password }: { username: string; password: string }) {
  try {
    console.log('[SIMPLE AUTH] Starting login with /api/auth/login endpoint');
    const response = await fetch(\`\${API_BASE_URL}/api/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, user: data };
    }
    throw new Error(data.error || 'Login failed');
  } catch (error) {
    console.error('[AUTH] Login failed:', error);
    throw error;
  }
}

/**
 * Simple registration function using the /api/auth/register endpoint
 */
export async function simpleRegister(userData: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<{ user: UserResponse }> {  
  try {
    console.log('[SIMPLE AUTH] Starting registration with /api/auth/register endpoint');
    console.log('[SIMPLE AUTH] Registration payload:', JSON.stringify({
      ...userData, 
      password: userData.password ? '******' : undefined
    }));
    const response = await fetch(\`\${API_BASE_URL}/api/auth/register\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    console.log(\`[SIMPLE AUTH] Registration endpoint responded with status: \${response.status}\`);
    if (response.ok) {
      const responseJson = await response.json();
      console.log('[SIMPLE AUTH] Registration successful');
      return { user: responseJson };
    }
    const errorMessage = await safeParseResponse(response);
    console.error(\`[SIMPLE AUTH] Registration failed with status \${response.status}: \${errorMessage}\`);
    throw new Error(\`Registration failed: \${errorMessage}\`);
  } catch (error) {
    console.error('[AUTH] Registration failed:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Network error - please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Determine if we should use the simplified registration flow
 */
export function shouldUseSimpleRegistration(): boolean {
  return true;
}

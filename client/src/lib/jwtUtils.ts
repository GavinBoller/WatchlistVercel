interface UserResponse {
  id: number;
  username: string;
  displayName: string;
  role: string;
  createdAt: Date;
}

export function getToken(): string | null {
  return localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token') || null;
}

export function parseUserFromToken(token: string): UserResponse | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      username: payload.username,
      displayName: payload.displayName || payload.username,
      role: payload.role || 'user',
      createdAt: new Date(payload.createdAt || Date.now()),
    };
  } catch (error) {
    console.error('[JWT] Error parsing token:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  const user = parseUserFromToken(token);
  return !!user;
}

export function setAuthHeader(headers: Headers): Headers {
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

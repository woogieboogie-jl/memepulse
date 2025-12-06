const AUTH_KEY = 'memepulse_auth';

export type StoredUser = {
  id: string;
  walletAddress: string;
  orderlyAccountId?: string;
  orderlyPublicKey?: string;
};

export type StoredAuth = {
  token: string;
  user: StoredUser;
};

export const authStorage = {
  setAuth(token: string, user: StoredUser): void {
    const auth: StoredAuth = { token, user };
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    }
  },

  getAuth(): StoredAuth | null {
    if (typeof window === 'undefined') return null;
    const authStr = localStorage.getItem(AUTH_KEY);
    if (!authStr) return null;
    try {
      return JSON.parse(authStr);
    } catch {
      return null;
    }
  },

  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
  },

  isAuthenticated(): boolean {
    const auth = this.getAuth();
    return !!auth?.token && !!auth?.user;
  },
};

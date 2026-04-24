import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from './api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api('/auth/me');
        setUser(user);
      } catch { /* not logged in */ }
      setLoading(false);
    })();
  }, []);

  async function login(email, password) {
    const { user, token } = await api('/auth/login', {
      method: 'POST', body: { email, password }, auth: false,
    });
    setToken(token);
    setUser(user);
  }

  async function signup(email, password, name, instructor = false) {
    const { user, token } = await api('/auth/signup', {
      method: 'POST', body: { email, password, name, instructor }, auth: false,
    });
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

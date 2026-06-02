import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthContextData {
  signed: boolean;
  user: any | null;
  signIn: (data: any) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const storagedToken = localStorage.getItem('@SisGAdm:token');
    if (storagedToken) {
      // Idealmente, validar o token no backend aqui
      setUser({ mock: true });
    }
  }, []);

  async function signIn({ usuario, senha, companhia }: any) {
    const response = await api.post('/auth/login', { usuario, senha, companhia });
    setUser(response.data.user || { usuario, companhia });
    localStorage.setItem('@SisGAdm:token', response.data.token);
  }

  function signOut() {
    localStorage.removeItem('@SisGAdm:token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

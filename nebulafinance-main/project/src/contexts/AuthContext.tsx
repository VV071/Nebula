import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  created_at: string;
  goals?: any[];
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo purposes
const DEMO_USER: User = {
  id: 1,
  email: 'demo@nebulafinance.com',
  created_at: new Date('2024-01-01').toISOString(),
  goals: []
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user was previously logged in
    const savedUser = localStorage.getItem('nebula_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Sanitize legacy demo IDs
        if (parsedUser.id === 'demo-user-123' || parsedUser.id === '1') {
          localStorage.removeItem('nebula_user');
          setUser(DEMO_USER);
          setSession({ user: DEMO_USER });
        } else {
          setUser(parsedUser);
          setSession({ user: parsedUser });
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('nebula_user');
      }
    } else {
      // Auto-login demo user to match backend's permissive auth
      setUser(DEMO_USER);
      setSession({ user: DEMO_USER });
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string) => {
    try {
      // Mock sign up - in production, this would call your backend API
      console.log('[Auth] Sign up:', email);

      const newUser: User = {
        id: Date.now(),
        email,
        created_at: new Date().toISOString()
      };

      setUser(newUser);
      setSession({ user: newUser });
      localStorage.setItem('nebula_user', JSON.stringify(newUser));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, _password: string) => {
    try {
      // Mock sign in - auto-login with demo user
      console.log('[Auth] Sign in:', email);

      setUser(DEMO_USER);
      setSession({ user: DEMO_USER });
      localStorage.setItem('nebula_user', JSON.stringify(DEMO_USER));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem('nebula_user');
    console.log('[Auth] Signed out');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

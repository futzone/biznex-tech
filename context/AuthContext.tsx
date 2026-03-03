import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import pb from "@/lib/pb";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pb.authStore.isValid) {
      setUser(pb.authStore.record as unknown as User);
    }
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as unknown as User | null);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await pb
      .collection("users")
      .authWithPassword(email, password);
    setUser(result.record as unknown as User);
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { create } from "zustand";

export interface User {
  userId: string;
  name: string;
  email: string;
  role: "student" | "teacher" | string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem("accessToken");
  const storedUser = localStorage.getItem("user");
  
  const userObj = storedUser ? JSON.parse(storedUser) : null;

  return {
    user: userObj,
    accessToken: storedToken,
    isAuthenticated: !!storedToken && !!userObj,

    setAuth: (user, accessToken) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    },

    setAccessToken: (accessToken) => {
      localStorage.setItem("accessToken", accessToken);
      set({ accessToken, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      set({ user: null, accessToken: null, isAuthenticated: false });
    },
  };
});

export default useAuthStore;

import { create } from "zustand";

type AuthState = {
  token: string | null;
  role: "Admin" | "User" | null;
  login: string | null;
  setAuth: (payload: {
    token: string;
    role: "Admin" | "User";
    login: string;
  }) => void;
  logout: () => void;
};

function decodeRole(token: string): "Admin" | "User" | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    const roles: string[] = ([] as string[]).concat(
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
        payload["role"] ??
        []
    );
    const r = roles.find((x) => x === "Admin" || x === "User");
    return (r as any) ?? null;
  } catch {
    return null;
  }
}

const token = localStorage.getItem("token");
const initialRole = token ? decodeRole(token) : null;
export const useAuth = create<AuthState>((set) => ({
  token,
  role: initialRole,
  login: null,
  setAuth: ({ token, role, login }) => {
    localStorage.setItem("token", token);
    set({ token, role: role ?? decodeRole(token) ?? null, login });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, role: null, login: null });
  },
}));

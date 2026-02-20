import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "./store";
import App from "./App";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal, non-expired JWT whose payload contains the given role. */
function makeToken(role: "Admin" | "User"): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const payload = btoa(
    JSON.stringify({
      sub: "test-user",
      role,
      exp,
    })
  );
  const signature = "fakesig";
  return `${header}.${payload}.${signature}`;
}

/** Reset the Zustand auth store to logged-out state before each test. */
function resetAuth() {
  useAuth.setState({ token: null, role: null, login: null });
}

/** Seed the auth store as if the user is logged in with the given role. */
function loginAs(role: "Admin" | "User") {
  const token = makeToken(role);
  useAuth.setState({ token, role, login: "testuser" });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetAuth();
  // Clear localStorage so the store initialisation doesn't pick up stale tokens
  localStorage.clear();
  // Reset the URL to the root so each test starts fresh
  window.history.pushState({}, "", "/");
});

// ---------------------------------------------------------------------------
// Header – unauthenticated
// ---------------------------------------------------------------------------

describe("Header – unauthenticated", () => {
  it("shows a login link when there is no token", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /logowanie/i })
    ).toBeInTheDocument();
  });

  it("does not show admin links when there is no token", () => {
    render(<App />);
    expect(
      screen.queryByRole("link", { name: /produkty/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /zamówienia/i })
    ).not.toBeInTheDocument();
  });

  it("does not show a logout button when there is no token", () => {
    render(<App />);
    expect(
      screen.queryByRole("button", { name: /wyloguj/i })
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Header – authenticated as Admin
// ---------------------------------------------------------------------------

describe("Header – Admin", () => {
  beforeEach(() => loginAs("Admin"));

  it("shows admin navigation links", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /produkty/i })).toBeInTheDocument();
    // Use exact text to avoid matching "Moje zamówienia"
    expect(
      screen.getByRole("link", { name: "Zamówienia" })
    ).toBeInTheDocument();
  });

  it("shows 'Złóż zamówienie' and 'Moje zamówienia' links", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /złóż zamówienie/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /moje zamówienia/i })
    ).toBeInTheDocument();
  });

  it("shows a logout button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /wyloguj/i })
    ).toBeInTheDocument();
  });

  it("does not show the login link", () => {
    render(<App />);
    expect(
      screen.queryByRole("link", { name: /logowanie/i })
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Header – authenticated as User
// ---------------------------------------------------------------------------

describe("Header – User", () => {
  beforeEach(() => loginAs("User"));

  it("does not show admin links", () => {
    render(<App />);
    expect(
      screen.queryByRole("link", { name: /produkty/i })
    ).not.toBeInTheDocument();
    // Use exact text to avoid matching "Moje zamówienia"
    expect(
      screen.queryByRole("link", { name: "Zamówienia" })
    ).not.toBeInTheDocument();
  });

  it("shows user navigation links", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /złóż zamówienie/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /moje zamówienia/i })
    ).toBeInTheDocument();
  });

  it("shows a logout button", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /wyloguj/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe("logout", () => {
  it("removes the token from the store when logout is clicked", async () => {
    loginAs("User");
    render(<App />);

    const logoutBtn = screen.getByRole("button", { name: /wyloguj/i });
    await userEvent.click(logoutBtn);

    expect(useAuth.getState().token).toBeNull();
    expect(useAuth.getState().role).toBeNull();
  });

  it("removes the token from localStorage when logout is clicked", async () => {
    loginAs("User");
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /wyloguj/i }));

    expect(localStorage.getItem("token")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// RequireAuth – redirect to /login when unauthenticated
// ---------------------------------------------------------------------------

describe("RequireAuth – unauthenticated redirects", () => {
  const protectedPaths = [
    "/admin/produkty",
    "/admin/zamowienia",
    "/zamow",
    "/moje-zamowienia",
  ];

  protectedPaths.forEach((path) => {
    it(`redirects ${path} to /login when not logged in`, () => {
      window.history.pushState({}, "", path);
      render(<App />);
      // After redirect the login form / page heading should be visible
      // and the URL should point to /login
      expect(window.location.pathname).toBe("/login");
    });
  });
});

// ---------------------------------------------------------------------------
// Routing – unknown path falls back to /login
// ---------------------------------------------------------------------------

describe("routing – wildcard fallback", () => {
  it("redirects unknown paths to /login", () => {
    window.history.pushState({}, "", "/this/does/not/exist");
    render(<App />);
    expect(window.location.pathname).toBe("/login");
  });
});

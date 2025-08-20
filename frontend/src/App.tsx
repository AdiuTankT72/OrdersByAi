import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import { useAuth } from "./store";
import LoginPage from "./pages/LoginPage";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import UserOrder from "./pages/UserOrder";
import UserOrders from "./pages/UserOrders";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const token = useAuth((s) => s.token);
  return (
    <BrowserRouter key={token || undefined}>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/produkty"
          element={
            <RequireAuth>
              <AdminProducts />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/zamowienia"
          element={
            <RequireAuth>
              <AdminOrders />
            </RequireAuth>
          }
        />
        <Route
          path="/zamow"
          element={
            <RequireAuth>
              <UserOrder />
            </RequireAuth>
          }
        />
        <Route
          path="/moje-zamowienia"
          element={
            <RequireAuth>
              <UserOrders />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

function Header() {
  const token = useAuth((s) => s.token);
  const role = useAuth((s) => s.role);
  const logout = useAuth((s) => s.logout);
  return (
    <nav
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderBottom: "1px solid #eee",
        alignItems: "center",
      }}
    >
      {!token && <Link to="/login">Logowanie</Link>}
      {token && (
        <>
          {role === "Admin" && (
            <>
              <Link to="/admin/produkty">Produkty</Link>
              <Link to="/admin/zamowienia">Zamówienia</Link>
            </>
          )}
          <Link to="/zamow">Złóż zamówienie</Link>
          <Link to="/moje-zamowienia">Moje zamówienia</Link>
          <button style={{ marginLeft: "auto" }} onClick={logout}>
            Wyloguj
          </button>
        </>
      )}
    </nav>
  );
}

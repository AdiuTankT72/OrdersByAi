import { type FormEvent, useState } from "react";
import { login as apiLogin } from "../api";
import { useAuth } from "../store";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const setAuth = useAuth((s) => s.setAuth);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const token = await apiLogin(login, password);
      // For demo, derive role by login name (admin/user)
      const role = login === "admin" ? "Admin" : "User";
      setAuth({ token, role, login });
      window.location.href = role === "Admin" ? "/admin/produkty" : "/zamow";
    } catch (e) {
      setErr("Błędny login lub hasło");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Logowanie</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Login</label>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Hasło</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        {err && <div style={{ color: "red" }}>{err}</div>}
        <button type="submit">Zaloguj</button>
      </form>
      <p>Dane testowe: admin/admin lub user/user</p>
    </div>
  );
}

import { type FormEvent, useState } from "react";
import { login as apiLogin } from "../api";
import { decodeRole, useAuth } from "../store";

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
      const role = decodeRole(token);
      setAuth({ token, role: role || "User", login });
      window.location.href = role === "Admin" ? "/admin/zamowienia" : "/zamow";
    } catch (e) {
      setErr("Błędny login lub hasło");
    }
  };

  return (
    <div>
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
    </div>
  );
}

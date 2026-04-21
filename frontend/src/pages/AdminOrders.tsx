import { useEffect, useState } from "react";
import {
  allOrders,
  updateOrderStatus,
  deleteOrder,
  getUsers,
  type Order,
  type OrderStatus,
  type User,
} from "../api";

export default function AdminOrders() {
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć to zamówienie?",
    );
    if (!confirmed) return;
    setLoadingId(id);
    setError(null);
    try {
      await deleteOrder(id);
      setOrders((prev) => prev!.filter((o) => o.id !== id));
    } catch (e: any) {
      setError("Błąd usuwania zamówienia");
    } finally {
      setLoadingId(null);
    }
  };
  const [orders, setOrders] = useState<Order[] | undefined>();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statuses: OrderStatus[] = ["Oczekuje", "Przyjęte", "Wysłano"];

  useEffect(() => {
    allOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
    getUsers().then(setUsers);
  }, []);

  const onChange = async (id: string, statusIdx: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const idx = Number(statusIdx);
      const statusValue: OrderStatus = statuses[idx];
      await updateOrderStatus(id, idx);
      setOrders((prev) =>
        prev!.map((o) => (o.id === id ? { ...o, status: statusValue } : o)),
      );
    } catch (e: any) {
      setError("Błąd zmiany statusu zamówienia");
    } finally {
      setLoadingId(null);
    }
  };

  if (orders === undefined) {
    return <div className="message">⏳ Wczytywanie...</div>;
  }

  return (
    <div>
      <h2>Zamówienia (wszystkie)</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <table width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", background: "#f5f5f5" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Data</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>
              Użytkownik
            </th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Pozycje</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, idx) => (
            <tr
              key={o.id}
              style={{
                borderBottom: "1px solid #e0e0e0",
                background: idx % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <td style={{ padding: "8px 12px", verticalAlign: "center" }}>
                {new Date(o.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "center" }}>
                {users.find((u) => u.id === o.userId)?.login ?? o.userId}
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "center" }}>
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "center" }}>
                <select
                  style={{ verticalAlign: "center" }}
                  value={
                    typeof o.status === "number"
                      ? o.status
                      : String(statuses.indexOf(o.status as OrderStatus))
                  }
                  disabled={loadingId === o.id}
                  onChange={(e) => onChange(o.id, e.target.value)}
                >
                  {statuses.map((label, idx) => (
                    <option key={idx} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
                {loadingId === o.id && (
                  <span style={{ marginLeft: 8 }}>⏳</span>
                )}
                <button
                  style={{
                    marginLeft: 8,
                    background: "#e53935",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                  disabled={loadingId === o.id}
                  onClick={() => handleDelete(o.id)}
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

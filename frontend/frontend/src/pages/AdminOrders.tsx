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
    setLoadingId(id);
    setError(null);
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e: any) {
      setError("Błąd usuwania zamówienia");
    } finally {
      setLoadingId(null);
    }
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statuses: OrderStatus[] = ["Oczekuje", "Przyjęte", "Wysłano"];
  const statusLabels = ["Oczekuje", "Przyjęte", "Wysłano"];

  useEffect(() => {
    allOrders().then(setOrders);
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
        prev.map((o) => (o.id === id ? { ...o, status: statusValue } : o))
      );
    } catch (e: any) {
      setError("Błąd zmiany statusu zamówienia");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Zamówienia (wszystkie)</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <table width="100%">
        <thead>
          <tr>
            <th>Data</th>
            <th>Użytkownik</th>
            <th>Pozycje</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>{users.find((u) => u.id === o.userId)?.login ?? o.userId}</td>
              <td>
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td>
                <select
                  value={
                    typeof o.status === "number"
                      ? o.status
                      : String(statuses.indexOf(o.status as OrderStatus))
                  }
                  disabled={loadingId === o.id}
                  onChange={(e) => onChange(o.id, e.target.value)}
                >
                  {statusLabels.map((label, idx) => (
                    <option key={idx} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
                {loadingId === o.id && (
                  <span style={{ marginLeft: 8 }}>⏳</span>
                )}
                <button
                  style={{ marginLeft: 8 }}
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

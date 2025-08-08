import { useEffect, useState } from "react";
import {
  allOrders,
  updateOrderStatus,
  getUsers,
  type Order,
  type OrderStatus,
  type User,
} from "../api";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statuses: OrderStatus[] = ["ToDo", "ToBeSent", "Sent"];

  useEffect(() => {
    allOrders().then(setOrders);
    getUsers().then(setUsers);
  }, []);

  const onChange = async (id: string, status: OrderStatus) => {
    setLoadingId(id);
    setError(null);
    try {
      const idx = statuses.indexOf(status);
      await updateOrderStatus(id, idx);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
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
                  value={o.status}
                  disabled={loadingId === o.id}
                  onChange={(e) =>
                    onChange(o.id, e.target.value as OrderStatus)
                  }
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {loadingId === o.id && (
                  <span style={{ marginLeft: 8 }}>⏳</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  allOrders,
  updateOrderStatus,
  deleteOrder,
  getUsers,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
  type User,
} from "../api";

export default function AdminOrders() {
  const isPendingOrder = (status: OrderStatus) => status === 1;
  const isWaitingOrder = (status: OrderStatus) => status === 0;

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
      const idx = Number(statusIdx) as OrderStatus;
      await updateOrderStatus(id, idx);
      setOrders((prev) =>
        prev!.map((o) => (o.id === id ? { ...o, status: idx } : o)),
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
      {error && <div className="error-message">{error}</div>}
      <table className="data-table">
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
            <tr
              key={o.id}
              className={
                isPendingOrder(o.status)
                  ? "order-row-pending"
                  : isWaitingOrder(o.status)
                    ? "order-row-waiting"
                    : undefined
              }
            >
              <td>
                {new Date(o.createdAt).toLocaleString("pl-PL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </td>
              <td>{users.find((u) => u.id === o.userId)?.login ?? o.userId}</td>
              <td>
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td>
                <select
                  value={o.status}
                  disabled={loadingId === o.id}
                  onChange={(e) => onChange(o.id, e.target.value)}
                >
                  {ORDER_STATUS_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
                {loadingId === o.id && (
                  <span className="status-spinner">⏳</span>
                )}
                <button
                  className="btn-danger btn-danger-inline"
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

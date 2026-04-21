import { useEffect, useState } from "react";
import { myOrders, type Order } from "../api";

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => setOrders(await myOrders());
  useEffect(() => {
    load();
  }, []);

  const statusNames = ["Oczekuje", "Przyjęte", "Wysłano"];
  const getStatusName = (status: string | number) => {
    if (typeof status === "number") return statusNames[status] ?? status;

    return status;
  };
  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Moje zamówienia</h2>
      <table width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", background: "#f5f5f5" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Data</th>
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
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "center" }}>
                {getStatusName(o.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

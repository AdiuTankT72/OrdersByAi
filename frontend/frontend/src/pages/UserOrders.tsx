import { useEffect, useState } from "react";
import { myOrders, type Order } from "../api";

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => setOrders(await myOrders());
  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h2>Moje zamówienia</h2>
      <table width="100%">
        <thead>
          <tr>
            <th>Data</th>
            <th>Pozycje</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

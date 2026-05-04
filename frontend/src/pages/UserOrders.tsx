import { useEffect, useState } from "react";
import { myOrders, ORDER_STATUS_LABELS, type Order } from "../api";

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => setOrders(await myOrders());
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container-wide">
      <h2>Moje zamówienia</h2>
      <table className="data-table">
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
              <td>
                {o.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
              </td>
              <td>{ORDER_STATUS_LABELS[o.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

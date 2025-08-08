import { useEffect, useState } from "react";
import { getProducts, placeOrder, type Product } from "../api";

export default function UserOrder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => setProducts(await getProducts().catch(() => []));
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const items = Object.entries(selected)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    try {
      await placeOrder(items);
      setSelected({});
      setMsg("Zamówienie złożone");
      await load();
    } catch {
      setMsg("Błąd składania zamówienia");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Złóż zamówienie</h2>
      {msg && <div>{msg}</div>}
      <table width="100%">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Dostępna ilość</th>
            <th>Ilość</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.quantity}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={p.quantity}
                  value={selected[p.id] ?? 0}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      [p.id]: Math.min(
                        p.quantity,
                        Math.max(0, parseInt(e.target.value || "0"))
                      ),
                    }))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={submit} style={{ marginTop: 12 }}>
        Zamów
      </button>
    </div>
  );
}

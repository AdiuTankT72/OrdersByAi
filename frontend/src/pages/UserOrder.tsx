import { useEffect, useState } from "react";
import { getProducts, placeOrder, type Product } from "../api";

export default function UserOrder() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = async () => setProducts(await getProducts().catch(() => []));
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const items = Object.entries(selected)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) return;
    // Validate if the sum of all quantities is divisible by 6
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity % 6 !== 0) {
      setMsg({
        type: "error",
        text: "Łączna ilość zamawianych produktów musi być wielokrotnością 6.",
      });
      return;
    }
    try {
      await placeOrder(items);
      setSelected({});
      setMsg({ type: "success", text: "Zamówienie złożone" });
      await load();
    } catch (err: any) {
      // Try to extract backend error message if present
      const backendMsg =
        err?.response?.data?.message || err?.response?.data?.error || "";
      if (backendMsg) {
        setMsg({ type: "error", text: backendMsg });
      } else {
        setMsg({
          type: "error",
          text: "Błąd składania zamówienia. Być może ktoś inny złożył zamówienie na ten produkt. Proszę odświeżyć stronę.",
        });
      }
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Złóż zamówienie</h2>
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
      {msg && (
        <div
          className={
            msg.type === "success" ? "success-message" : "error-message"
          }
        >
          {msg.text}
        </div>
      )}
      <button onClick={submit} style={{ marginTop: 12 }}>
        Zamów
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getProducts, placeOrder, type Product } from "../api";

export default function UserOrder() {
  const [products, setProducts] = useState<Product[] | undefined>(undefined);
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

  if (products === undefined) {
    return <div className="message">⏳ Wczytywanie...</div>;
  }

  return (
    <div>
      <h2>Złóż zamówienie</h2>
      <table width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", background: "#f5f5f5" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Produkt</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>
              Dostępna ilość
            </th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Ilość</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr
              key={p.id}
              style={{
                borderBottom: "1px solid #e0e0e0",
                background: idx % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <td
                className={p.quantity > 0 ? "available" : ""}
                style={{ padding: "8px 12px", verticalAlign: "middle" }}
              >
                {p.name}
              </td>
              <td
                className={p.quantity > 0 ? "available" : ""}
                style={{ padding: "8px 12px", verticalAlign: "middle" }}
              >
                {p.quantity}
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                <input
                  type="number"
                  min={0}
                  max={p.quantity}
                  disabled={p.quantity === 0}
                  value={selected[p.id] ?? 0}
                  onChange={(e) =>
                    setSelected((s) => ({
                      ...s,
                      [p.id]: Math.min(
                        p.quantity,
                        Math.max(0, parseInt(e.target.value || "0")),
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

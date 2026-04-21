import { useEffect, useState } from "react";
import {
  addProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
} from "../api";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(0);

  const load = async () => setProducts(await getProducts());
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!name) return;
    const p = await addProduct({ name, quantity: qty });
    setProducts((prev) => [...prev, p]);
    setName("");
    setQty(0);
  };
  const save = async (p: Product) => {
    await updateProduct(p.id, { name: p.name, quantity: p.quantity });
  };
  const remove = async (id: string) => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten produkt?")) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ maxWidth: 800, margin: "20px auto" }}>
      <h2>Produkty</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Nazwa"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Ilość"
          type="number"
          value={qty}
          min={0}
          onChange={(e) => setQty(parseInt(e.target.value || "0"))}
        />
        <button onClick={add}>Dodaj</button>
      </div>
      <table width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", background: "#f5f5f5" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Nazwa</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Ilość</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Akcje</th>
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
              <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                <input
                  value={p.name}
                  onChange={(e) =>
                    setProducts((ps) =>
                      ps.map((x) =>
                        x.id === p.id ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  onBlur={() => save(p)}
                />
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                <input
                  type="number"
                  value={p.quantity}
                  min={0}
                  onChange={(e) =>
                    setProducts((ps) =>
                      ps.map((x) =>
                        x.id === p.id
                          ? { ...x, quantity: parseInt(e.target.value || "0") }
                          : x,
                      ),
                    )
                  }
                  onBlur={() => save(p)}
                />
              </td>
              <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    background: "#e53935",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
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

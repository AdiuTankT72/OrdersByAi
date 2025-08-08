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
          onChange={(e) => setQty(parseInt(e.target.value || "0"))}
        />
        <button onClick={add}>Dodaj</button>
      </div>
      <table width="100%">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Ilość</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <input
                  value={p.name}
                  onChange={(e) =>
                    setProducts((ps) =>
                      ps.map((x) =>
                        x.id === p.id ? { ...x, name: e.target.value } : x
                      )
                    )
                  }
                  onBlur={() => save(p)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.quantity}
                  onChange={(e) =>
                    setProducts((ps) =>
                      ps.map((x) =>
                        x.id === p.id
                          ? { ...x, quantity: parseInt(e.target.value || "0") }
                          : x
                      )
                    )
                  }
                  onBlur={() => save(p)}
                />
              </td>
              <td>
                <button onClick={() => remove(p.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

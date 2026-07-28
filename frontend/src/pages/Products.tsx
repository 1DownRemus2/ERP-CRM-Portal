import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: string;
  stock: number;
  minStock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", unitPrice: "", stock: "0", minStock: "0" });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", unitPrice: "", minStock: "" });
  const [movement, setMovement] = useState({ quantity: "1", movementType: "IN", reason: "" });
  const [rowError, setRowError] = useState("");

  function openRow(p: Product) {
    if (expandedId === p.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(p.id);
    setEditForm({ name: p.name, unitPrice: p.unitPrice, minStock: String(p.minStock) });
    setMovement({ quantity: "1", movementType: "IN", reason: "" });
    setRowError("");
  }

  async function handleEditSave(productId: string) {
    setRowError("");
    try {
      await api.patch(`/products/${productId}`, {
        name: editForm.name,
        unitPrice: editForm.unitPrice,
        minStock: editForm.minStock,
      });
      load();
    } catch (err: any) {
      setRowError(err.response?.data?.error || "Failed to update product");
    }
  }

  async function handleMovementSubmit(productId: string) {
    setRowError("");
    try {
      await api.post(`/products/${productId}/stock-movements`, movement);
      setMovement({ quantity: "1", movementType: "IN", reason: "" });
      load();
    } catch (err: any) {
      setRowError(err.response?.data?.error || "Failed to record stock movement");
    }
  }

  async function load() {
    const res = await api.get("/products", { params: { search } });
    setProducts(res.data.items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/products", form);
      setForm({ name: "", sku: "", unitPrice: "", stock: "0", minStock: "0" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add product");
    }
  }

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Products & Inventory</h2>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Add Product"}</button>
      </div>

      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 16 }}
      />

      {showForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: 20, padding: 16, border: "1px solid #ddd" }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            required
            style={{ marginRight: 8, padding: 6 }}
          />
          <input
            placeholder="Unit Price"
            type="number"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            required
            style={{ marginRight: 8, padding: 6, width: 100 }}
          />
          <input
            placeholder="Opening Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            style={{ marginRight: 8, padding: 6, width: 100 }}
          />
          <input
            placeholder="Min Stock Alert"
            type="number"
            value={form.minStock}
            onChange={(e) => setForm({ ...form, minStock: e.target.value })}
            style={{ marginRight: 8, padding: 6, width: 100 }}
          />
          <button type="submit">Save</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      )}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Min Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <>
              <tr
                key={p.id}
                style={{
                  borderBottom: "1px solid #eee",
                  background: p.stock <= p.minStock ? "#fff4e5" : undefined,
                }}
              >
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>₹{p.unitPrice}</td>
                <td>{p.stock}</td>
                <td>{p.minStock}</td>
                <td>
                  <button onClick={() => openRow(p)}>
                    {expandedId === p.id ? "Close" : "Edit / Adjust Stock"}
                  </button>
                </td>
              </tr>
              {expandedId === p.id && (
                <tr>
                  <td colSpan={6} style={{ background: "#fafafa", padding: 16 }}>
                    {rowError && <p style={{ color: "red" }}>{rowError}</p>}

                    <div style={{ marginBottom: 16 }}>
                      <b>Edit Product</b>
                      <div style={{ marginTop: 8 }}>
                        <input
                          placeholder="Name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          style={{ marginRight: 8, padding: 6 }}
                        />
                        <input
                          placeholder="Unit Price"
                          type="number"
                          value={editForm.unitPrice}
                          onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                          style={{ marginRight: 8, padding: 6, width: 100 }}
                        />
                        <input
                          placeholder="Min Stock"
                          type="number"
                          value={editForm.minStock}
                          onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                          style={{ marginRight: 8, padding: 6, width: 100 }}
                        />
                        <button onClick={() => handleEditSave(p.id)}>Save</button>
                      </div>
                    </div>

                    <div>
                      <b>Adjust Stock</b>
                      <div style={{ marginTop: 8 }}>
                        <select
                          value={movement.movementType}
                          onChange={(e) => setMovement({ ...movement, movementType: e.target.value })}
                          style={{ marginRight: 8, padding: 6 }}
                        >
                          <option value="IN">Stock IN</option>
                          <option value="OUT">Stock OUT</option>
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={movement.quantity}
                          onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                          style={{ marginRight: 8, padding: 6, width: 80 }}
                        />
                        <input
                          placeholder="Reason (e.g. new purchase, damage)"
                          value={movement.reason}
                          onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                          style={{ marginRight: 8, padding: 6, width: 220 }}
                        />
                        <button onClick={() => handleMovementSubmit(p.id)}>Record</button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

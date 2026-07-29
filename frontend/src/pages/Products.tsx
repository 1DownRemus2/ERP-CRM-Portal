import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: string;
  stock: number;
  minStock: number;
  location?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unitPrice: "",
    stock: "0",
    minStock: "0",
    location: "",
  });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", unitPrice: "", minStock: "", location: "" });
  const [movement, setMovement] = useState({ quantity: "1", movementType: "IN", reason: "" });
  const [rowError, setRowError] = useState("");

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
      setForm({ name: "", sku: "", category: "", unitPrice: "", stock: "0", minStock: "0", location: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add product");
    }
  }

  function openRow(p: Product) {
    if (expandedId === p.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(p.id);
    setEditForm({
      name: p.name,
      category: p.category || "",
      unitPrice: p.unitPrice,
      minStock: String(p.minStock),
      location: p.location || "",
    });
    setMovement({ quantity: "1", movementType: "IN", reason: "" });
    setRowError("");
  }

  async function handleEditSave(productId: string) {
    setRowError("");
    try {
      await api.patch(`/products/${productId}`, {
        name: editForm.name,
        category: editForm.category,
        unitPrice: editForm.unitPrice,
        minStock: editForm.minStock,
        location: editForm.location,
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

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="eyebrow">Warehouse Ledger</div>
          <h1>Inventory</h1>
        </div>
        <button className="accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Product"}
        </button>
      </div>

      <input
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 20 }}
      />

      {showForm && (
        <form onSubmit={handleAdd} className="panel">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <label className="field-label">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="field-label">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required className="mono" />
            </div>
            <div>
              <label className="field-label">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Unit Price (₹)</label>
              <input
                type="number"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
                style={{ width: 110 }}
              />
            </div>
            <div>
              <label className="field-label">Opening Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                style={{ width: 110 }}
              />
            </div>
            <div>
              <label className="field-label">Min Stock Alert</label>
              <input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                style={{ width: 110 }}
              />
            </div>
            <div>
              <label className="field-label">Location / Warehouse</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <button type="submit">Save Product</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <table className="ledger">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <>
              <tr key={p.id} className={p.stock <= p.minStock ? "low-stock" : ""}>
                <td>{p.name}</td>
                <td className="mono">{p.sku}</td>
                <td>{p.category || "—"}</td>
                <td className="mono">₹{p.unitPrice}</td>
                <td className="mono">{p.stock}</td>
                <td className="mono">{p.minStock}</td>
                <td>{p.location || "—"}</td>
                <td>
                  <button className="secondary" onClick={() => openRow(p)}>
                    {expandedId === p.id ? "Close" : "Edit / Adjust"}
                  </button>
                </td>
              </tr>
              {expandedId === p.id && (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div style={{ background: "var(--paper)", padding: 20, borderBottom: "1px solid var(--line)" }}>
                      {rowError && <p className="error-text">{rowError}</p>}

                      <div style={{ marginBottom: 20 }}>
                        <div className="eyebrow" style={{ marginBottom: 10 }}>Edit Product</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div>
                            <label className="field-label">Name</label>
                            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="field-label">Category</label>
                            <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                          </div>
                          <div>
                            <label className="field-label">Unit Price</label>
                            <input
                              type="number"
                              value={editForm.unitPrice}
                              onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                              style={{ width: 110 }}
                            />
                          </div>
                          <div>
                            <label className="field-label">Min Stock</label>
                            <input
                              type="number"
                              value={editForm.minStock}
                              onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                              style={{ width: 110 }}
                            />
                          </div>
                          <div>
                            <label className="field-label">Location</label>
                            <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                          </div>
                          <button className="secondary" onClick={() => handleEditSave(p.id)}>
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="eyebrow" style={{ marginBottom: 10 }}>Adjust Stock</div>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                          <div>
                            <label className="field-label">Direction</label>
                            <select
                              value={movement.movementType}
                              onChange={(e) => setMovement({ ...movement, movementType: e.target.value })}
                            >
                              <option value="IN">Stock IN</option>
                              <option value="OUT">Stock OUT</option>
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Quantity</label>
                            <input
                              type="number"
                              min={1}
                              value={movement.quantity}
                              onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                              style={{ width: 90 }}
                            />
                          </div>
                          <div>
                            <label className="field-label">Reason</label>
                            <input
                              placeholder="e.g. new purchase, damage"
                              value={movement.reason}
                              onChange={(e) => setMovement({ ...movement, reason: e.target.value })}
                              style={{ width: 240 }}
                            />
                          </div>
                          <button className="accent" onClick={() => handleMovementSubmit(p.id)}>
                            Record Movement
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} style={{ color: "var(--text-soft)", textAlign: "center", padding: 32 }}>
                No products yet. Add your first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}

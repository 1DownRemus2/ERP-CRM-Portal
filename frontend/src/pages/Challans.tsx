import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Stamp from "../components/Stamp";

interface Challan {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  customer: { name: string };
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
}

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ productId: "", quantity: 1 }]);
  const [error, setError] = useState("");

  async function load() {
    const [c, cust, prod] = await Promise.all([
      api.get("/challans"),
      api.get("/customers", { params: { limit: 100 } }),
      api.get("/products", { params: { limit: 100 } }),
    ]);
    setChallans(c.data.items);
    setCustomers(cust.data.items);
    setProducts(prod.data.items);
  }

  useEffect(() => {
    load();
  }, []);

  function updateLine(i: number, field: "productId" | "quantity", value: string) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: field === "quantity" ? Number(value) : value } : l))
    );
  }

  async function handleCreate(e: FormEvent, status: "DRAFT" | "CONFIRMED") {
    e.preventDefault();
    setError("");
    try {
      await api.post("/challans", { customerId, items: lines, status });
      setCustomerId("");
      setLines([{ productId: "", quantity: 1 }]);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create challan");
    }
  }

  async function handleConfirm(id: string) {
    setError("");
    try {
      await api.patch(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to confirm challan");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="eyebrow">Dispatch Register</div>
          <h1>Sales Challans</h1>
        </div>
        <button className="accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Challan"}
        </button>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

      {showForm && (
        <div className="panel">
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="eyebrow" style={{ marginBottom: 8 }}>Line Items</div>
          {lines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, "productId", e.target.value)}
                required
                style={{ flex: 1 }}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.stock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(i, "quantity", e.target.value)}
                style={{ width: 90 }}
              />
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}
            style={{ marginBottom: 20 }}
          >
            + Add Line
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="secondary" onClick={(e) => handleCreate(e, "DRAFT")}>
              Save as Draft
            </button>
            <button className="accent" onClick={(e) => handleCreate(e, "CONFIRMED")}>
              Save &amp; Confirm
            </button>
          </div>
        </div>
      )}

      <table className="ledger">
        <thead>
          <tr>
            <th>Challan No.</th>
            <th>Customer</th>
            <th>Qty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {challans.map((c) => (
            <tr key={c.id}>
              <td className="mono">{c.challanNumber}</td>
              <td>{c.customer.name}</td>
              <td className="mono">{c.totalQuantity}</td>
              <td>
                <Stamp status={c.status} />
              </td>
              <td>
                {c.status === "DRAFT" && (
                  <button className="secondary" onClick={() => handleConfirm(c.id)}>
                    Confirm
                  </button>
                )}
              </td>
            </tr>
          ))}
          {challans.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--text-soft)", textAlign: "center", padding: 32 }}>
                No challans yet. Create your first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}

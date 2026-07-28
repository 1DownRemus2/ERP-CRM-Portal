import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";

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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Sales Challans</h2>
        <button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New Challan"}</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {showForm && (
        <form style={{ marginBottom: 20, padding: 16, border: "1px solid #ddd" }}>
          <div style={{ marginBottom: 12 }}>
            <label>Customer: </label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {lines.map((line, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, "productId", e.target.value)}
                required
                style={{ marginRight: 8 }}
              >
                <option value="">Select product</option>
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
                style={{ width: 80 }}
              />
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { productId: "", quantity: 1 }])}>
            + Add product line
          </button>

          <div style={{ marginTop: 16 }}>
            <button onClick={(e) => handleCreate(e, "DRAFT")} style={{ marginRight: 8 }}>
              Save as Draft
            </button>
            <button onClick={(e) => handleCreate(e, "CONFIRMED")}>Save & Confirm</button>
          </div>
        </form>
      )}

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th>Challan #</th>
            <th>Customer</th>
            <th>Qty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {challans.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{c.challanNumber}</td>
              <td>{c.customer.name}</td>
              <td>{c.totalQuantity}</td>
              <td>{c.status}</td>
              <td>
                {c.status === "DRAFT" && <button onClick={() => handleConfirm(c.id)}>Confirm</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

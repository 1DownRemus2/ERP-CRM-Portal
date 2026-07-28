import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Stamp from "../components/Stamp";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  businessName?: string;
  customerType: string;
  status: string;
  followUpDate?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    businessName: "",
    customerType: "RETAIL",
  });
  const [error, setError] = useState("");

  async function load() {
    const res = await api.get("/customers", { params: { search } });
    setCustomers(res.data.items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/customers", form);
      setForm({ name: "", mobile: "", businessName: "", customerType: "RETAIL" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add customer");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM Ledger</div>
          <h1>Customers</h1>
        </div>
        <button className="accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Customer"}
        </button>
      </div>

      <input
        placeholder="Search by name, mobile, or business…"
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
              <label className="field-label">Mobile</label>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            </div>
            <div>
              <label className="field-label">Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Type</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value })}
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>
          <button type="submit">Save Customer</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      <table className="ledger">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Business</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/customers/${c.id}`}>{c.name}</Link>
              </td>
              <td className="mono">{c.mobile}</td>
              <td>{c.businessName || "—"}</td>
              <td>{c.customerType}</td>
              <td>
                <Stamp status={c.status} />
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--text-soft)", textAlign: "center", padding: 32 }}>
                No customers yet. Add your first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}

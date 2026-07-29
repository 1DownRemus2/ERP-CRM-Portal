import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Stamp from "../components/Stamp";
import { useAuth } from "../context/AuthContext";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: string;
  address?: string;
  status: string;
  followUpDate?: string;
  notes?: string;
}

const emptyEditForm = {
  name: "",
  mobile: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [rowError, setRowError] = useState("");

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

  function openRow(c: Customer) {
    if (expandedId === c.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(c.id);
    setEditForm({
      name: c.name,
      mobile: c.mobile,
      email: c.email || "",
      businessName: c.businessName || "",
      gstNumber: c.gstNumber || "",
      customerType: c.customerType,
      address: c.address || "",
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : "",
      notes: c.notes || "",
    });
    setRowError("");
  }

  async function handleEditSave(customerId: string) {
    setRowError("");
    try {
      await api.patch(`/customers/${customerId}`, {
        ...editForm,
        followUpDate: editForm.followUpDate ? new Date(editForm.followUpDate).toISOString() : undefined,
      });
      setExpandedId(null);
      load();
    } catch (err: any) {
      setRowError(err.response?.data?.error || "Failed to update customer");
    }
  }

  async function handleDelete(customerId: string, name: string) {
    setRowError("");
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${customerId}`);
      setExpandedId(null);
      load();
    } catch (err: any) {
      setRowError(err.response?.data?.error || "Failed to delete customer");
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
          <p style={{ fontSize: 13, color: "var(--text-soft)", marginTop: 0, marginBottom: 12 }}>
            Just the essentials to get started — you can add GST, address, and other details
            afterward using "Edit" below.
          </p>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <>
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
                <td>
                  <button className="secondary" onClick={() => openRow(c)}>
                    {expandedId === c.id ? "Close" : "Edit"}
                  </button>
                </td>
              </tr>
              {expandedId === c.id && (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <div style={{ background: "var(--paper)", padding: 20, borderBottom: "1px solid var(--line)" }}>
                      {rowError && <p className="error-text">{rowError}</p>}

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                        <div>
                          <label className="field-label">Name</label>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="field-label">Mobile</label>
                          <input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
                        </div>
                        <div>
                          <label className="field-label">Email</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="field-label">Business Name</label>
                          <input
                            value={editForm.businessName}
                            onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="field-label">GST Number</label>
                          <input
                            value={editForm.gstNumber}
                            onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="field-label">Type</label>
                          <select
                            value={editForm.customerType}
                            onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value })}
                          >
                            <option value="RETAIL">Retail</option>
                            <option value="WHOLESALE">Wholesale</option>
                            <option value="DISTRIBUTOR">Distributor</option>
                          </select>
                        </div>
                        <div>
                          <label className="field-label">Status</label>
                          <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                            <option value="LEAD">Lead</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </div>
                        <div>
                          <label className="field-label">Follow-up Date</label>
                          <input
                            type="date"
                            value={editForm.followUpDate}
                            onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
                          />
                        </div>
                        <div style={{ flexBasis: "100%" }}>
                          <label className="field-label">Address</label>
                          <input
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div style={{ flexBasis: "100%" }}>
                          <label className="field-label">Notes</label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            rows={2}
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                        <button className="accent" onClick={() => handleEditSave(c.id)}>
                          Save Changes
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            style={{ background: "var(--rust)", borderColor: "var(--rust)" }}
                          >
                            Delete Customer
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {customers.length === 0 && (
            <tr>
              <td colSpan={6} style={{ color: "var(--text-soft)", textAlign: "center", padding: 32 }}>
                No customers yet. Add your first one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}

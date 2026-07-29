import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Stamp from "../components/Stamp";

interface FollowUp {
  id: string;
  note: string;
  createdAt: string;
}

interface CustomerDetail {
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
  followUps: FollowUp[];
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

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState("");

  async function load() {
    const res = await api.get(`/customers/${id}`);
    setCustomer(res.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!note.trim()) return;
    try {
      await api.post(`/customers/${id}/follow-ups`, { note });
      setNote("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add follow-up");
    }
  }

  function openEdit() {
    if (!customer) return;
    setEditForm({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || "",
      businessName: customer.businessName || "",
      gstNumber: customer.gstNumber || "",
      customerType: customer.customerType,
      address: customer.address || "",
      status: customer.status,
      followUpDate: customer.followUpDate ? customer.followUpDate.slice(0, 10) : "",
      notes: customer.notes || "",
    });
    setEditError("");
    setIsEditing(true);
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();
    setEditError("");
    try {
      await api.patch(`/customers/${id}`, {
        ...editForm,
        followUpDate: editForm.followUpDate ? new Date(editForm.followUpDate).toISOString() : undefined,
      });
      setIsEditing(false);
      load();
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Failed to update customer");
    }
  }

  if (!customer) {
    return (
      <Layout>
        <p style={{ color: "var(--text-soft)" }}>Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/customers" style={{ fontSize: 13, fontWeight: 600 }}>
        ← Back to Customers
      </Link>

      <div className="page-header" style={{ marginTop: 12 }}>
        <div>
          <div className="eyebrow">Customer Record</div>
          <h1>{customer.name}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Stamp status={customer.status} />
          {!isEditing && (
            <button className="secondary" onClick={openEdit}>
              Edit Customer
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="panel">
          <table style={{ width: "100%" }}>
            <tbody>
              {[
                ["Mobile", customer.mobile, true],
                ["Email", customer.email || "—", false],
                ["Business", customer.businessName || "—", false],
                ["GST Number", customer.gstNumber || "—", true],
                ["Type", customer.customerType, false],
                ["Address", customer.address || "—", false],
                [
                  "Follow-up Date",
                  customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : "—",
                  false,
                ],
                ["Notes", customer.notes || "—", false],
              ].map(([label, value, isMono]) => (
                <tr key={label as string}>
                  <td style={{ padding: "8px 16px 8px 0", width: 140 }} className="field-label">
                    {label}
                  </td>
                  <td style={{ padding: "8px 0" }} className={isMono ? "mono" : ""}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleEditSave} className="panel">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <label className="field-label">Name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="field-label">Mobile</label>
              <input value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required />
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
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="accent">
              Save Changes
            </button>
            <button type="button" className="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
          {editError && <p className="error-text">{editError}</p>}
        </form>
      )}

      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Follow-up Notes</h3>
      <form onSubmit={handleAddNote} className="panel">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a follow-up note…"
          rows={3}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit">Add Note</button>
        {error && <p className="error-text">{error}</p>}
      </form>

      {customer.followUps.length === 0 && (
        <p style={{ color: "var(--text-soft)" }}>No follow-ups logged yet.</p>
      )}
      {customer.followUps.map((f) => (
        <div key={f.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
          <div>{f.note}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 4 }}>
            {new Date(f.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </Layout>
  );
}

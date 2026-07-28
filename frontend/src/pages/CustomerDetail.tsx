import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";

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
  followUps: FollowUp[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

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

  if (!customer) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/customers">&larr; Back to Customers</Link>
      <h2>{customer.name}</h2>

      <table cellPadding={6} style={{ marginBottom: 24 }}>
        <tbody>
          <tr><td><b>Mobile</b></td><td>{customer.mobile}</td></tr>
          <tr><td><b>Email</b></td><td>{customer.email || "-"}</td></tr>
          <tr><td><b>Business</b></td><td>{customer.businessName || "-"}</td></tr>
          <tr><td><b>GST Number</b></td><td>{customer.gstNumber || "-"}</td></tr>
          <tr><td><b>Type</b></td><td>{customer.customerType}</td></tr>
          <tr><td><b>Status</b></td><td>{customer.status}</td></tr>
          <tr><td><b>Address</b></td><td>{customer.address || "-"}</td></tr>
        </tbody>
      </table>

      <h3>Follow-up Notes</h3>
      <form onSubmit={handleAddNote} style={{ marginBottom: 16 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a follow-up note..."
          rows={3}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button type="submit">Add Note</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {customer.followUps.length === 0 && <p style={{ color: "#666" }}>No follow-ups yet.</p>}
        {customer.followUps.map((f) => (
          <li key={f.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
            <div>{f.note}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{new Date(f.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}

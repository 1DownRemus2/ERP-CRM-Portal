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
        <Stamp status={customer.status} />
      </div>

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

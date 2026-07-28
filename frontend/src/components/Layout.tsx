import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 960, margin: "0 auto", padding: 20 }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/customers">Customers</Link>
          <Link to="/products">Products</Link>
          <Link to="/challans">Challans</Link>
        </div>
        <div>
          <span style={{ marginRight: 12, fontSize: 14, color: "#555" }}>
            {user?.name} ({user?.role})
          </span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </nav>
      {children}
    </div>
  );
}

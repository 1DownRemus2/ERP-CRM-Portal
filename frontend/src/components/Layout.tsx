import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function isActive(path: string) {
    return location.pathname.startsWith(path);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Dockmaster
          <span>Ops Portal</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/customers" className={isActive("/customers") ? "active" : ""}>
            Customers
          </Link>
          <Link to="/products" className={isActive("/products") ? "active" : ""}>
            Inventory
          </Link>
          <Link to="/challans" className={isActive("/challans") ? "active" : ""}>
            Challans
          </Link>
        </nav>
        <div className="sidebar-user">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button className="secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Package, LogOut, Settings, LayoutDashboard, Users, Image, FileText } from 'lucide-react';
import { initialPatients } from '../../data/mockData';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState(initialPatients);

  const handleLogout = () => {
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/agenda', icon: <Calendar size={20} />, label: 'Agenda' },
    { path: '/admin/patients', icon: <Users size={20} />, label: 'Pacientes' },
    { path: '/admin/imagenologia', icon: <Image size={20} />, label: 'Imagenología' },
    { path: '/admin/informes', icon: <FileText size={20} />, label: 'Informes' },
    { path: '/admin/inventory', icon: <Package size={20} />, label: 'Inventario' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="logo">
            Clinic<span className="logo-accent">Plus</span>
          </Link>
          <div className="admin-badge">CMS</div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-item ${
                    location.pathname === item.path ||
                    (item.path !== '/admin' && location.pathname.startsWith(item.path))
                      ? 'active'
                      : ''
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <h2>
            {menuItems.find(
              (item) =>
                item.path === location.pathname ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
            )?.label || 'Panel de Administración'}
          </h2>
          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </div>

        <div className="admin-content-area">
          <Outlet context={{ patients, setPatients }} />
        </div>
      </main>

      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-secondary);
        }

        /* Sidebar Styles */
        .admin-sidebar {
          width: 260px;
          background-color: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 10;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header .logo {
          font-size: 1.5rem;
          text-decoration: none;
        }

        .admin-badge {
          display: inline-block;
          background-color: var(--accent-color);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 0;
          overflow-y: auto;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          color: var(--accent-color);
          background-color: rgba(37, 99, 235, 0.05);
        }

        .nav-item.active {
          color: var(--accent-color);
          background-color: rgba(37, 99, 235, 0.08);
          border-left-color: var(--accent-color);
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background-color: #fee2e2;
          color: #dc2626;
        }

        /* Main Content Styles */
        .admin-main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
        }

        .admin-topbar {
          height: 70px;
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .admin-topbar h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background-color: var(--accent-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-profile span {
          font-weight: 500;
          color: var(--text-primary);
        }

        .admin-content-area {
          padding: 2rem;
          flex: 1;
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          
          .admin-sidebar.open {
            transform: translateX(0);
          }

          .admin-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

import React, { Suspense, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Package, LogOut, Settings, LayoutDashboard, Users, Image, FileText, Menu, X, BarChart3, Building2, Receipt, FlaskConical, Handshake, Wallet } from 'lucide-react';
import { createInitialAppointments, initialEstudios, initialInventory, initialPatients } from '../../data/mockData';
import { usePersistentState } from '../../utils/usePersistentState';
import { isSetupAccount, logout } from '../../utils/auth';
import SectionCoachmark from './SectionCoachmark';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // La cuenta secundaria empieza con todo en cero; la admin conserva los datos de ejemplo.
  const setup = isSetupAccount();
  const [patients, setPatients] = usePersistentState('clinicplus_patients', setup ? {} : initialPatients);
  const [appointments, setAppointments] = usePersistentState('clinicplus_appointments', setup ? [] : createInitialAppointments);
  const [inventory, setInventory] = usePersistentState('clinicplus_inventory', setup ? [] : initialInventory);
  const [estudios, setEstudios] = usePersistentState('clinicplus_estudios', setup ? [] : initialEstudios);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/agenda', icon: <Calendar size={20} />, label: 'Agenda' },
    { path: '/admin/patients', icon: <Users size={20} />, label: 'Pacientes' },
    { path: '/admin/imagenologia', icon: <Image size={20} />, label: 'Imagenología' },
    { path: '/admin/informes', icon: <FileText size={20} />, label: 'Informes' },
    { path: '/admin/inventory', icon: <Package size={20} />, label: 'Inventario' },
    { path: '/admin/reportes', icon: <BarChart3 size={20} />, label: 'Reportes' },
    { path: '/admin/sucursales', icon: <Building2 size={20} />, label: 'Sucursales' },
    { path: '/admin/gastos', icon: <Receipt size={20} />, label: 'Gastos' },
    { path: '/admin/laboratorio', icon: <FlaskConical size={20} />, label: 'Laboratorio' },
    { path: '/admin/convenios', icon: <Handshake size={20} />, label: 'Convenios' },
    { path: '/admin/liquidaciones', icon: <Wallet size={20} />, label: 'Liquidaciones' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Configuración' },
  ];

  return (
    <div className="admin-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin" className="logo" onClick={closeSidebar}>
            Clinic<span className="logo-accent">Plus</span>
          </Link>
          <div className="admin-badge">CMS</div>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Cerrar menú">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={closeSidebar}
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
          <div className="topbar-title">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <Menu size={22} />
            </button>
            <h2>
              {menuItems.find(
                (item) =>
                  item.path === location.pathname ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path))
              )?.label || 'Panel de Administración'}
            </h2>
          </div>
          <div className="user-profile">
            <div className="avatar">A</div>
            <span>Admin</span>
          </div>
        </div>

        <div className="admin-content-area">
          <SectionCoachmark />
          <Suspense fallback={null}>
            <Outlet context={{ patients, setPatients, appointments, setAppointments, inventory, setInventory, estudios, setEstudios }} />
          </Suspense>
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
          height: 100dvh;
          left: 0;
          top: 0;
          z-index: 40;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 30;
        }

        .sidebar-toggle,
        .sidebar-close {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
          flex-shrink: 0;
        }

        .sidebar-close {
          position: absolute;
          top: 1rem;
          right: 0.75rem;
        }

        .sidebar-header {
          position: relative;
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
          min-width: 0;
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
          gap: 1rem;
          padding: 0 var(--content-pad);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .topbar-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }

        .admin-topbar h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          padding: var(--content-pad);
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 1024px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: var(--shadow-lg);
          }

          .sidebar-overlay,
          .sidebar-toggle,
          .sidebar-close {
            display: block;
          }

          .admin-main {
            margin-left: 0;
          }

          .admin-topbar {
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;

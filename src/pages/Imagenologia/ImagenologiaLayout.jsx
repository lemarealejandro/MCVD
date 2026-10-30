import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Image, FileText, Settings, Layout } from 'lucide-react';

const ImagenologiaLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/imagenologia', label: 'Estudios', icon: Image, exact: true },
    { path: '/admin/imagenologia/plantillas', label: 'Plantillas', icon: Layout },
  ];

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="cms-page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="stat-icon bg-blue-100 text-blue-600" style={{ width: '40px', height: '40px' }}>
            <Image size={20} />
          </div>
          <div>
            <h2 className="dashboard-title">Imagenología</h2>
            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Gestión de estudios y reportes</p>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="btn-small"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  backgroundColor: active ? 'var(--accent-color)' : 'transparent',
                  color: active ? 'white' : 'var(--text-secondary)',
                  borderColor: active ? 'var(--accent-color)' : 'var(--border-color)',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="imagenologia-content" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ImagenologiaLayout;

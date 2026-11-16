import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { isAuthenticated, login } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const destination = location.state?.from || '/admin/agenda';

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await login(username, password);
    setSubmitting(false);
    if (result.success) {
      navigate(destination, { replace: true });
    } else {
      setError(result.error);
    }
  };

  if (isAuthenticated()) return <Navigate to={destination} replace />;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            Clinic<span className="logo-accent">Plus</span>
          </div>
          <h2>Acceso al Sistema</h2>
          <p>Ingresa tus credenciales para gestionar el contenido</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Usuario</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
          </div>

          {error && <p className="status-message error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-secondary);
          padding: 2rem;
        }

        .login-card {
          background-color: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 3rem;
          width: 100%;
          max-width: 450px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header .logo {
          font-size: 2rem;
          margin-bottom: 1rem;
          display: inline-block;
        }

        .login-header h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-tertiary);
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-family: var(--font-family);
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: var(--bg-secondary);
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--accent-color);
          background-color: var(--bg-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .btn-full {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          margin-top: 0.5rem;
        }

        @media (max-width: 480px) {
          .login-container { padding: 1rem; }
          .login-card { padding: 2rem 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Login;

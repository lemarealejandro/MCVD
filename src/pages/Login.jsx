import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { isAuthenticated, login } from '../utils/auth';
import './auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const destination = location.state?.from || '/admin/agenda';

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await login(email, password);
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
            <label htmlFor="email">Correo</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
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
                autoComplete="current-password"
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

        <p className="auth-switch">¿Tu clínica aún no tiene cuenta? <Link to="/registro">Solicita acceso</Link></p>
      </div>

    </div>
  );
};

export default Login;

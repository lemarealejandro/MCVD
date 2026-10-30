import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Menu, X, Globe, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-content">
        <a href="#" className="logo">
          Clinic<span className="logo-accent">Plus</span>
        </a>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li><a href="#services">{t('nav.services')}</a></li>
            <li><a href="#about">{t('nav.about')}</a></li>
            <li><a href="#why-us">{t('nav.whyUs')}</a></li>
            <li><a href="#testimonials">{t('nav.testimonials')}</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle Language">
            <Globe size={18} />
            <span>{language.toUpperCase()}</span>
          </button>
          
          <button onClick={() => navigate('/login')} className="lang-toggle access-btn">
            <User size={18} />
            <span>Acceso</span>
          </button>
          
          <a href="#contact" className="btn header-btn desktop-only">{t('nav.book')}</a>

          <button 
            className="mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-links">
          <li><a href="#services" onClick={() => setMobileMenuOpen(false)}>{t('nav.services')}</a></li>
          <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>{t('nav.about')}</a></li>
          <li><a href="#why-us" onClick={() => setMobileMenuOpen(false)}>{t('nav.whyUs')}</a></li>
          <li><a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>{t('nav.testimonials')}</a></li>
          <li><button className="btn-link mobile-nav-link" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Acceso</button></li>
          <li><a href="#contact" className="btn btn-mobile-nav" onClick={() => setMobileMenuOpen(false)}>{t('nav.book')}</a></li>
        </ul>
      </div>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          transition: all 0.3s ease;
          background-color: transparent;
          padding: 1.5rem 0;
        }

        .header.scrolled {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 0;
          box-shadow: var(--shadow-sm);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .logo-accent {
          color: var(--accent-color);
        }

        .desktop-nav .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-links a {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .nav-links a:hover {
          color: var(--accent-color);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .lang-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 500;
          color: var(--text-primary);
          transition: color 0.3s ease;
        }

        .lang-toggle:hover, .access-btn:hover {
          color: var(--accent-color);
        }
        
        .access-btn {
          margin-left: -0.5rem;
        }

        .header-btn {
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
          .desktop-only {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }

          .mobile-nav {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: var(--bg-primary);
            padding: 2rem 1.5rem;
            box-shadow: var(--shadow-md);
            clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
            transition: clip-path 0.4s ease-in-out;
          }

          .mobile-nav.open {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }

          .mobile-nav-links {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            text-align: center;
          }

          .mobile-nav-links a, .mobile-nav-link {
            font-size: 1.25rem;
            font-weight: 500;
            display: block;
            background: none;
            border: none;
            color: var(--text-primary);
            font-family: inherit;
            cursor: pointer;
            width: 100%;
          }
          
          .btn-mobile-nav {
            margin-top: 1rem;
            display: inline-block;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;

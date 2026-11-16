import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-logo">
          Clinic<span className="logo-accent">Plus</span>
        </div>
        <p className="footer-rights">
          &copy; {currentYear} ClinicPlus. {t('footer.rights')}
        </p>
      </div>

      <style>{`
        .footer {
          background-color: var(--text-primary);
          color: var(--bg-primary);
          padding: 3rem 0;
          text-align: center;
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .logo-accent {
          color: var(--accent-color);
        }

        .footer-rights {
          color: #9ca3af;
          font-size: 0.9rem;
        }
      `}</style>
    </footer>
  );
};

export default Footer;

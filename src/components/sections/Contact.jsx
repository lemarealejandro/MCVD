import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, Phone } from 'lucide-react';

const Contact = () => {
  const { t } = useLanguage();

  return (
    <section className="section contact" id="contact">
      <div className="container contact-container">
        <div className="contact-info">
          <h2 className="section-title">{t('contact.title')}</h2>
          
          <div className="info-item">
            <MapPin className="info-icon" />
            <p>{t('contact.address')}</p>
          </div>
          
          <div className="info-item">
            <Phone className="info-icon" />
            <p>{t('contact.phone')}</p>
          </div>

          <div className="map-wrapper">
            {/* Map Placeholder */}
            <div className="map-placeholder">
              <span>{t('nav.contact') === 'Contacto' ? 'Mapa de Google Maps' : 'Google Maps Integration'}</span>
            </div>
          </div>
        </div>

        <div className="contact-form">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="name">{t('contact.form.name')}</label>
              <input type="text" id="name" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">{t('contact.form.phone')}</label>
              <input type="tel" id="phone" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">{t('contact.form.email')}</label>
              <input type="email" id="email" required />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">{t('contact.form.message')}</label>
              <textarea id="message" rows="4" required></textarea>
            </div>
            
            <button type="submit" className="btn w-100">{t('contact.form.submit')}</button>
          </form>
        </div>
      </div>

      <style>{`
        .contact {
          background-color: var(--bg-tertiary);
        }

        .contact-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .info-icon {
          color: var(--accent-color);
          flex-shrink: 0;
        }

        .map-wrapper {
          margin-top: 3rem;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .map-placeholder {
          width: 100%;
          height: 300px;
          background-color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .contact-form {
          background-color: var(--bg-primary);
          padding: 3rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: var(--radius-sm);
          font-family: var(--font-family);
          font-size: 1rem;
          transition: border-color 0.3s ease;
          background-color: #f9fafb;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-color);
          background-color: var(--bg-primary);
        }

        .w-100 {
          width: 100%;
        }

        @media (max-width: 992px) {
          .contact-container {
            grid-template-columns: 1fr;
            gap: 4rem;
          }
          
          .contact-form {
            padding: 2rem;
          }
        }
      `}</style>
    </section>
  );
};

export default Contact;

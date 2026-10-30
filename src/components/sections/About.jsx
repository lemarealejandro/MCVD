import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';

const About = () => {
  const { t } = useLanguage();

  return (
    <section className="section about" id="about">
      <div className="container about-container">
        <motion.div 
          className="about-image-wrapper"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Doctor" 
            className="about-image"
          />
          <div className="experience-badge">
            <span className="badge-number">15+</span>
            <span className="badge-text">{t('nav.about') === 'Nosotros' ? 'Años de Experiencia' : 'Years Experience'}</span>
          </div>
        </motion.div>
        
        <motion.div 
          className="about-content"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <h2 className="section-title">{t('about.title')}</h2>
          <p className="about-text">{t('about.description1')}</p>
          <p className="about-text">{t('about.description2')}</p>
          
          <div className="doctor-profile">
            <h4 className="doctor-name">{t('about.doctorName')}</h4>
            <span className="doctor-title">{t('about.doctorTitle')}</span>
          </div>
        </motion.div>
      </div>

      <style>{`
        .about {
          background-color: var(--bg-tertiary);
        }

        .about-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5rem;
          align-items: center;
        }

        .about-image-wrapper {
          position: relative;
        }

        .about-image {
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          width: 100%;
          height: auto;
          aspect-ratio: 4/5;
          object-fit: cover;
        }

        .experience-badge {
          position: absolute;
          bottom: -20px;
          right: -20px;
          background-color: var(--accent-color);
          color: white;
          padding: 1.5rem;
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-sm);
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        .badge-number {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1;
        }

        .badge-text {
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.5rem;
        }

        .about-text {
          margin-bottom: 1.5rem;
        }
        
        .doctor-profile {
          margin-top: 2.5rem;
          padding-left: 1.5rem;
          border-left: 3px solid var(--accent-color);
        }

        .doctor-name {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .doctor-title {
          color: var(--accent-color);
          font-weight: 500;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        @media (max-width: 992px) {
          .about-container {
            grid-template-columns: 1fr;
            gap: 4rem;
          }

          .about-image {
            aspect-ratio: 16/9;
          }

          .experience-badge {
            bottom: -20px;
            right: 20px;
          }
        }
      `}</style>
    </section>
  );
};

export default About;

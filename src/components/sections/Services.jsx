import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Activity, Star, Smile, Shield, Sparkles } from 'lucide-react';
import { content } from '../../data/content';
import { motion } from 'framer-motion';

const iconMap = {
  cleaning: <Sparkles size={32} strokeWidth={1.5} />,
  whitening: <Star size={32} strokeWidth={1.5} />,
  orthodontics: <Smile size={32} strokeWidth={1.5} />,
  implants: <Shield size={32} strokeWidth={1.5} />,
  cosmetic: <Activity size={32} strokeWidth={1.5} />
};

const Services = () => {
  const { t, language } = useLanguage();
  const items = content[language].services.items;

  return (
    <section className="section services" id="services">
      <div className="container">
        <motion.h2 
          className="section-title text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {t('services.title')}
        </motion.h2>
        
        <div className="services-grid">
          {items.map((service, index) => (
            <motion.div 
              className="service-card" 
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="service-icon">
                {iconMap[service.id]}
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .services {
          background-color: var(--bg-primary);
        }

        .text-center {
          text-align: center;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .service-card {
          padding: 2.5rem 2rem;
          background-color: var(--bg-primary);
          border-radius: var(--radius-md);
          border: 1px solid var(--bg-secondary);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-md);
          border-color: transparent;
        }

        .service-icon {
          color: var(--accent-color);
          margin-bottom: 1.5rem;
          background-color: var(--bg-tertiary);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-title {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .service-desc {
          font-size: 1rem;
          margin-bottom: 0;
        }
      `}</style>
    </section>
  );
};

export default Services;

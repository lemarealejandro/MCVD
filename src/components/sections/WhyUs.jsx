import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Award, Monitor, Users, Heart } from 'lucide-react';
import { content } from '../../data/content';
import { motion } from 'framer-motion';

const iconMap = {
  experience: <Award size={24} strokeWidth={1.5} />,
  technology: <Monitor size={24} strokeWidth={1.5} />,
  personalized: <Users size={24} strokeWidth={1.5} />,
  comfort: <Heart size={24} strokeWidth={1.5} />
};

const WhyUs = () => {
  const { t, language } = useLanguage();
  const items = content[language].whyUs.items;

  return (
    <section className="section why-us" id="why-us">
      <div className="container">
        <motion.h2 
          className="section-title text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {t('whyUs.title')}
        </motion.h2>
        
        <div className="features-grid">
          {items.map((item, index) => (
            <motion.div 
              className="feature-item" 
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="feature-icon">
                {iconMap[item.id]}
              </div>
              <div className="feature-content">
                <h4 className="feature-title">{item.title}</h4>
                <p className="feature-desc">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .why-us {
          background-color: var(--bg-primary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 3rem;
          margin-top: 4rem;
        }

        .feature-item {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .feature-icon {
          color: var(--accent-color);
          background-color: var(--bg-tertiary);
          width: 50px;
          height: 50px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .feature-desc {
          font-size: 0.95rem;
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .feature-item {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }
        }
      `}</style>
    </section>
  );
};

export default WhyUs;

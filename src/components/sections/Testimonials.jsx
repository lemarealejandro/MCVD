import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Quote } from 'lucide-react';
import { content } from '../../data/content';
import { motion } from 'framer-motion';

const Testimonials = () => {
  const { t, language } = useLanguage();
  const items = content[language].testimonials.items;

  return (
    <section className="section testimonials" id="testimonials">
      <div className="container">
        <motion.h2 
          className="section-title text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {t('testimonials.title')}
        </motion.h2>
        
        <div className="testimonials-grid">
          {items.map((item, index) => (
            <motion.div 
              className="testimonial-card" 
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="quote-icon">
                <Quote size={32} />
              </div>
              <p className="testimonial-text">"{item.text}"</p>
              <h4 className="testimonial-author">- {item.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonials {
          background-color: var(--bg-secondary);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .testimonial-card {
          background-color: var(--bg-primary);
          padding: 2.5rem;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          position: relative;
        }

        .quote-icon {
          color: var(--bg-secondary);
          position: absolute;
          top: 1.5rem;
          right: 2rem;
          opacity: 0.5;
        }

        .testimonial-text {
          font-size: 1.125rem;
          font-style: italic;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .testimonial-author {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent-color);
        }
      `}</style>
    </section>
  );
};

export default Testimonials;

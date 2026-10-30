import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="hero" id="hero">
      {/* Background Video */}
      <div className="hero-video-wrapper">
        <div className="hero-overlay"></div>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="hero-video"
          poster="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
        >
          {/* Using a premium feeling stock video of a smiling woman/patient */}
          <source src="https://assets.mixkit.co/videos/preview/mixkit-happy-smiling-woman-looking-at-camera-32668-large.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">{t('hero.headline')}</h1>
          <p className="hero-subtitle">{t('hero.subheadline')}</p>
          <div className="hero-actions">
            <a href="#contact" className="btn hero-btn">{t('hero.bookCta')}</a>
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 6rem 0;
          overflow: hidden;
        }

        .hero-video-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(255, 255, 255, 0.8) 40%, 
            rgba(255, 255, 255, 0.2) 100%
          );
          z-index: 1;
        }

        .hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-container {
          position: relative;
          z-index: 2;
          width: 100%;
        }

        .hero-content {
          max-width: 650px;
          animation: fadeInUp 1s ease-out forwards;
        }

        .hero-title {
          font-size: clamp(3rem, 6vw, 5rem);
          margin-bottom: 1.5rem;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .hero-subtitle {
          margin-bottom: 2.5rem;
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 500px;
        }

        .hero-btn {
          padding: 1.25rem 2.75rem;
          font-size: 1.125rem;
          box-shadow: 0 10px 25px rgba(85, 181, 217, 0.4);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 992px) {
          .hero-overlay {
            background: linear-gradient(
              to bottom, 
              rgba(255, 255, 255, 0.9) 0%, 
              rgba(255, 255, 255, 0.8) 50%, 
              rgba(255, 255, 255, 0.6) 100%
            );
          }
        }

        @media (max-width: 768px) {
          .hero {
            min-height: 85vh;
            text-align: center;
          }
          .hero-content {
            margin: 0 auto;
          }
          .hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;


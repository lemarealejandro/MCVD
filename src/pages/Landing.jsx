import React from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import Services from '../components/sections/Services'
import About from '../components/sections/About'
import WhyUs from '../components/sections/WhyUs'
import Testimonials from '../components/sections/Testimonials'
import Contact from '../components/sections/Contact'
import { MessageCircle } from 'lucide-react'

const Landing = () => {
  const whatsappNumber = "56912345678"; // Replace with real number
  const whatsappMessage = "Hola! Me gustaría agendar una hora.";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <About />
        <WhyUs />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      
      {/* Floating WhatsApp Button */}
      <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-float">
        <MessageCircle size={28} />
      </a>

      <style>{`
        .whatsapp-float {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background-color: #25D366;
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          z-index: 100;
          transition: transform 0.3s ease;
        }

        .whatsapp-float:hover {
          transform: scale(1.1);
          color: white;
        }

        @media (max-width: 768px) {
          .whatsapp-float {
            bottom: 1.5rem;
            right: 1.5rem;
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </>
  )
}

export default Landing;

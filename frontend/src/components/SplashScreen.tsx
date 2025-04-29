import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish,
  duration = 5000 // Default 5 seconds
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'logoReveal' | 'textReveal' | 'fadeOut'>('initial');

  useEffect(() => {
    // Ensure we start with initial phase
    setAnimationPhase('initial');
    
    // First phase: Logo reveal - start earlier to account for slower animation
    const logoTimer = setTimeout(() => {
      setAnimationPhase('logoReveal');
    }, 300);
    
    // Second phase: Reveal text animation - delayed to give logo more time to complete
    const revealTimer = setTimeout(() => {
      setAnimationPhase('textReveal');
    }, 2200);
    
    // Third phase: Fade out
    const fadeTimer = setTimeout(() => {
      setAnimationPhase('fadeOut');
    }, duration - 800); // Start fade out before end
    
    // Final: Animation complete, trigger onFinish
    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);
    
    // Clean up all timers
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(revealTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 z-[9999]
        ${animationPhase === 'fadeOut' ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ transition: 'opacity 0.8s ease-in-out' }}
    >
      <div className="w-full max-w-md px-8 text-center">
        {/* Logo SVG from public folder */}
        <div className="relative mx-auto mb-12 flex justify-center">
          <div 
            className={`w-52 h-52 transition-all ${animationPhase === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            style={{ 
              transform: animationPhase === 'initial' ? 'scale(0) rotate(-180deg)' : 'scale(1) rotate(0deg)',
              transition: 'transform 2s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 1.5s ease-out'
            }}
          >
            <img 
              src="/Logo.svg" 
              alt="Libroware Logo" 
              className="w-full h-full"
            />
          </div>
        </div>
        
        {/* Text with typing effect */}
        <h1 className="font-serif text-4xl font-bold text-white relative">
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.3s'
              }}
            >
              L
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.35s'
              }}
            >
              i
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.4s'
              }}
            >
              b
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.45s'
              }}
            >
              r
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.5s'
              }}
            >
              o
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.55s'
              }}
            >
              w
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.6s'
              }}
            >
              a
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.65s'
              }}
            >
              r
            </span>
          </span>
          <span className="relative inline-block overflow-hidden">
            <span 
              className={`
                ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
              `}
              style={{ 
                display: 'inline-block',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                transitionDelay: '0.7s'
              }}
            >
              e
            </span>
          </span>
        </h1>
        
        {/* Tagline with fade-in effect */}
        <p 
          className={`mt-4 text-emerald-100 text-lg
            ${animationPhase === 'textReveal' || animationPhase === 'fadeOut' ? 'opacity-100' : 'opacity-0'} 
          `}
          style={{ 
            transition: 'opacity 0.8s ease-out',
            transitionDelay: '1s'
          }}
        >
          Your modern library management system
        </p>
      </div>
    </div>
  );
};

export default SplashScreen; 
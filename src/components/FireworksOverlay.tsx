import { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

const COLORS = ['#6366F1', '#818CF8', '#A5B4FC', '#F8F8F8', '#C7D2FE'];

export const FireworksOverlay = ({ onClose }: { onClose: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  // Trigger fade-in
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for fade-out
    }, 4000); // total animation duration
    return () => clearTimeout(timer);
  }, [onClose]);

  // Initialize particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    // Create bursts
    const burstCount = 6 + Math.floor(Math.random() * 3); // 6-8 bursts
    for (let b = 0; b < burstCount; b++) {
      const burstX = Math.random() * (width - 100) + 50;
      const burstY = Math.random() * (height - 100) + 50;
      const particleCount = 40 + Math.floor(Math.random() * 21); // 40-60 particles

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          size: 1 + Math.random() * 2,
        });
      }
    }

    // Animation loop
    const update = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.alpha -= 0.012;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (alive) {
        animationRef.current = requestAnimationFrame(update);
      } else {
        animationRef.current = null;
        setVisible(false);
        setTimeout(onClose, 300);
      }
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onClose]);

  const handleClick = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClick}
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};
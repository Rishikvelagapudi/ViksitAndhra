import React, { useEffect, useRef } from 'react';

export const MovingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const updateDimensions = () => {
      if (!canvas || !container) return;
      
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      const docWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        window.innerWidth
      );

      width = canvas.width = docWidth;
      height = canvas.height = docHeight;
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(document.body);

    window.addEventListener('resize', updateDimensions);
    window.addEventListener('scroll', updateDimensions);

    // Mouse tracking
    let mouse = { x: width / 2, y: height / 2, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.pageX;
      mouse.y = e.pageY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Particle system
    const particleCount = Math.min(Math.floor((width * height) / 22000), 90);
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }

    const colors = [
      'rgba(0, 225, 255, ',   // Neon Cyan
      'rgba(0, 136, 255, ',   // Royal Blue
      'rgba(255, 0, 60, ',    // Crimson Red
      'rgba(168, 85, 247, ',  // Neon Purple
    ];

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (width || window.innerWidth),
      y: Math.random() * (height || window.innerHeight),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.6 + 0.3,
      pulseSpeed: Math.random() * 0.02 + 0.008,
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Render Particles & Floating Constellation Connections
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.alpha += Math.sin(time * 2 + idx) * 0.006;
        const clampedAlpha = Math.max(0.2, Math.min(0.85, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${clampedAlpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color}1)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${p.color}${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 170) {
            const mouseAlpha = (1 - dist / 170) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(0, 225, 255, ${mouseAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      // Interactive mouse spotlight aura
      if (mouse.active) {
        const radGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          260
        );
        radGrad.addColorStop(0, 'rgba(0, 225, 255, 0.09)');
        radGrad.addColorStop(0.5, 'rgba(255, 0, 60, 0.03)');
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('scroll', updateDimensions);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-[-1] overflow-hidden pointer-events-none select-none"
    >
      {/* Dark background base */}
      <div className="absolute inset-0 w-full h-full bg-[#03050c]" />

      {/* Animated Floating Gradient Orbs */}
      <div className="absolute top-[-5%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-cyan-500/25 via-blue-600/15 to-transparent blur-[130px] animate-orb-float-1" />
      <div className="absolute bottom-[5%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-red-600/20 via-rose-500/10 to-transparent blur-[150px] animate-orb-float-2" />
      <div className="absolute top-[35%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-purple-600/15 via-indigo-500/10 to-transparent blur-[120px] animate-orb-float-3" />
      <div className="absolute top-[65%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-bl from-cyan-400/20 via-teal-500/10 to-transparent blur-[110px] animate-orb-float-4" />

      {/* Vignette Overlay */}
      <div className="absolute inset-0 w-full h-full cinematic-vignette" />

      {/* Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full object-cover" />

      {/* Digital Noise Texture */}
      <div className="absolute inset-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.035] mix-blend-overlay" />
    </div>
  );
};

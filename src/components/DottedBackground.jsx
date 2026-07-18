import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Interactive Dotted Background Canvas.
 * Creates a subtle grid of small dots that react dynamically when the cursor approaches,
 * sliding away with spring-like physics and bouncing back when the cursor leaves.
 * Automatically adapts colors depending on the active theme mode.
 */
export default function DottedBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let dots = [];
    const spacing = 32; // Grid spacing of dots
    const mouse = { x: null, y: null, radius: 110 };

    const initDots = () => {
      dots = [];
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          dots.push({
            baseX: x,
            baseY: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            size: 1.5,
          });
        }
      }
    };

    const handleResize = () => {
      initDots();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    initDots();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // Not so vibrant colors matching the dark/light background themes
      const baseDotColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
      const activeDotColor = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.3)';

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let dx = 0;
        let dy = 0;
        let dist = 0;
        let isClose = false;

        if (mouse.x !== null && mouse.y !== null) {
          dx = mouse.x - dot.x;
          dy = mouse.y - dot.y;
          dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            isClose = true;
            // Calculate force multiplier
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);

            // Push dot away in opposite direction
            const pushX = Math.cos(angle) * force * 8;
            const pushY = Math.sin(angle) * force * 8;

            dot.vx -= pushX;
            dot.vy -= pushY;
          }
        }

        // Return force back to original baseline grid position (spring physics)
        const returnForceX = (dot.baseX - dot.x) * 0.06;
        const returnForceY = (dot.baseY - dot.y) * 0.06;

        dot.vx += returnForceX;
        dot.vy += returnForceY;

        // Apply friction damping
        dot.vx *= 0.82;
        dot.vy *= 0.82;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dot with dynamic sizing on cursor proximity (splash scale effect)
        ctx.beginPath();
        const currentSize = isClose 
          ? dot.size + (1 - dist / mouse.radius) * 1.8 
          : dot.size;
          
        ctx.arc(dot.x, dot.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = isClose ? activeDotColor : baseDotColor;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}

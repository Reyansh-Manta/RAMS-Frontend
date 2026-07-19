import { useEffect, useRef } from 'react';

/**
 * High-Fidelity Interactive Dotted Background Canvas.
 * - Draws a subtle grid of dots.
 * - Pulls dots closer to cursor/touch point using attraction physics.
 * - Simulates decibel-controlled Web Audio synth blips (ticks) on interaction.
 * - Triggers soft hardware vibrations on touch devices.
 * - Adapts colors dynamically to light/dark modes.
 * - Handles phone swipe tracking and springs back dot alignment.
 * - Propagates a fading wave ripple across coordinates on sidebar expand/collapse triggers.
 */
export default function DottedBackground({ waveTrigger }) {
  const canvasRef = useRef(null);
  const waveTriggerRef = useRef(waveTrigger);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let dots = [];
    let activeWaves = [];
    const spacing = 32; // Grid spacing
    const mouse = { x: null, y: null, radius: 120 };

    // Rate-limiting interaction sounds/vibrations to avoid spamming
    let lastSoundTime = 0;
    let lastVibrateTime = 0;
    let audioCtx = null;

    const playInteractionBlip = () => {
      const isSoundEnabled = localStorage.getItem('rams_dotted_sound') !== 'false';
      if (!isSoundEnabled) return;

      const now = Date.now();
      if (now - lastSoundTime < 80) return; // limit sound to once every 80ms
      lastSoundTime = now;

      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Very high subtle retro tick
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.008, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {
        console.error('AudioContext synth blip failed:', e);
      }
    };

    const triggerVibration = () => {
      const isHapticEnabled = localStorage.getItem('rams_dotted_haptic') !== 'false';
      if (!isHapticEnabled || !navigator.vibrate) return;

      const now = Date.now();
      if (now - lastVibrateTime < 180) return; // limit vibration to once every 180ms
      lastVibrateTime = now;

      navigator.vibrate(5); // Ultra short tick
    };

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

    // Phone / Mobile Touch support
    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Wire touch handlers directly
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    initDots();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // Match themes accurately with high-contrast, premium colors
      const baseDotColorStr = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.18)';
      const activeDotColorStr = isDark ? 'rgba(192, 132, 252, 0.5)' : 'rgba(15, 23, 42, 0.45)';

      const now = Date.now();

      // Process and clean up completed waves
      activeWaves = activeWaves.filter(w => (now - w.startTime) < w.duration);

      // Check if a new wave needs to be spawned from waveTrigger
      if (waveTrigger && waveTrigger !== waveTriggerRef.current) {
        waveTriggerRef.current = waveTrigger;
        activeWaves.push({
          startTime: now,
          originX: 68, // Left sidebar bounds origin
          speed: 800, // Pixels per second
          duration: 1000, // ms duration of decay
          amplitude: 36, // Max coordinate offset
          wavelength: 180, // crest size
        });
      }

      const isBackgroundEnabled = localStorage.getItem('rams_dotted_bg') !== 'false';
      if (!isBackgroundEnabled) {
        // If background is toggled off, only keep animation loop running to track triggers
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let dx = 0;
        let dy = 0;
        let dist = 0;
        let isClose = false;

        // 1. Mouse/Touch Attraction Physics
        if (mouse.x !== null && mouse.y !== null) {
          dx = mouse.x - dot.x;
          dy = mouse.y - dot.y;
          dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            isClose = true;
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);

            // Pull dot closer to cursor (attraction force)
            const pullX = Math.cos(angle) * force * 7.5;
            const pullY = Math.sin(angle) * force * 7.5;

            dot.vx += pullX;
            dot.vy += pullY;

            // Trigger feedback effects when dot gets pulled
            if (dist < 40) {
              playInteractionBlip();
              triggerVibration();
            }
          }
        }

        // 2. Wave Ripple Offset calculations
        let waveDisplacementX = 0;
        let waveOpacityMultiplier = 1.0;

        for (let w = 0; w < activeWaves.length; w++) {
          const wave = activeWaves[w];
          const elapsed = (now - wave.startTime) / 1000;
          const waveFront = elapsed * wave.speed;
          const distanceToOrigin = dot.baseX - wave.originX;

          if (distanceToOrigin > 0) {
            const distToFront = Math.abs(distanceToOrigin - waveFront);
            if (distToFront < wave.wavelength) {
              const progress = (now - wave.startTime) / wave.duration;
              const decay = (1 - progress) * (1 - distToFront / wave.wavelength);
              
              if (decay > 0) {
                const phase = ((distanceToOrigin - waveFront) / wave.wavelength) * Math.PI;
                waveDisplacementX += Math.sin(phase) * wave.amplitude * decay;
                waveOpacityMultiplier += 0.85 * decay;
              }
            }
          }
        }

        // 3. Return Spring physics back to original baseline grid position (adjusted by wave offset)
        const targetX = dot.baseX + waveDisplacementX;
        const returnForceX = (targetX - dot.x) * 0.06;
        const returnForceY = (dot.baseY - dot.y) * 0.06;

        dot.vx += returnForceX;
        dot.vy += returnForceY;

        // Apply friction damping
        dot.vx *= 0.82;
        dot.vy *= 0.82;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // 4. Draw Dot
        ctx.beginPath();
        const currentSize = isClose 
          ? dot.size + (1 - dist / mouse.radius) * 1.5 
          : dot.size;
          
        ctx.arc(dot.x, dot.y, currentSize, 0, Math.PI * 2);

        // Adjust color opacity based on active waves and mouse closeness
        let alpha = isClose ? 0.5 + (1 - dist / mouse.radius) * 0.3 : 0.22;
        alpha *= waveOpacityMultiplier;
        
        ctx.fillStyle = isClose || waveDisplacementX !== 0
          ? (isDark ? `rgba(192, 132, 252, ${Math.min(alpha, 0.95)})` : `rgba(15, 23, 42, ${Math.min(alpha, 0.95)})`)
          : (isDark ? `rgba(255, 255, 255, ${0.14 * waveOpacityMultiplier})` : `rgba(15, 23, 42, ${0.18 * waveOpacityMultiplier})`);
          
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [waveTrigger]);

  return (
    <canvas
      ref={canvasRef}
      className="dotted-background-canvas"
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

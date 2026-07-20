import { useEffect, useRef } from 'react';

/**
 * High-Fidelity Interactive Dotted Background Canvas.
 * - Subtle grid of dots.
 * - Gently nudges dots towards cursor (max 6px offset) without dancing or clumping.
 * - Triggers Web Audio synth blips & haptic feedback STRICTLY on cursor/finger movement.
 * - Volume and Haptic intensity configurable via localStorage settings.
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
    const spacing = 32;
    const mouse = { x: null, y: null, radius: 110 };

    let lastSoundTime = 0;
    let lastVibrateTime = 0;
    let audioCtx = null;

    const playInteractionBlip = () => {
      const isSoundEnabled = localStorage.getItem('rams_dotted_sound') !== 'false';
      if (!isSoundEnabled) return;

      const volSetting = parseFloat(localStorage.getItem('rams_dotted_sound_vol') || '0.25');
      if (volSetting <= 0) return;

      const now = Date.now();
      if (now - lastSoundTime < 60) return; // rate-limit blips
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

        // Crisp audio synth blip
        osc.frequency.setValueAtTime(960, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.06);

        gainNode.gain.setValueAtTime(volSetting * 0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.06);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      } catch (e) {
        console.error('AudioContext synth blip failed:', e);
      }
    };

    const triggerVibration = () => {
      const isHapticEnabled = localStorage.getItem('rams_dotted_haptic') !== 'false';
      if (!isHapticEnabled || !navigator.vibrate) return;

      const level = localStorage.getItem('rams_dotted_haptic_level') || 'mid';
      if (level === 'off') return;

      const duration = level === 'high' ? 45 : (level === 'low' ? 10 : 25);

      const now = Date.now();
      if (now - lastVibrateTime < 140) return;
      lastVibrateTime = now;

      navigator.vibrate(duration);
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
            size: 1.5,
          });
        }
      }
    };

    const handleResize = () => {
      initDots();
    };

    const checkProximityTrigger = (mouseX, mouseY) => {
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouseX - dot.baseX;
        const dy = mouseY - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          playInteractionBlip();
          triggerVibration();
          break; // trigger once per movement
        }
      }
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      checkProximityTrigger(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        checkProximityTrigger(mouse.x, mouse.y);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        checkProximityTrigger(mouse.x, mouse.y);
      }
    };

    const handleTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    initDots();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      const now = Date.now();
      activeWaves = activeWaves.filter(w => (now - w.startTime) < w.duration);

      if (waveTrigger && waveTrigger !== waveTriggerRef.current) {
        waveTriggerRef.current = waveTrigger;
        activeWaves.push({
          startTime: now,
          originX: 68,
          speed: 750,
          duration: 900,
          amplitude: 28,
          wavelength: 160,
        });
      }

      const isBackgroundEnabled = localStorage.getItem('rams_dotted_bg') !== 'false';
      if (!isBackgroundEnabled) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        let pullX = 0;
        let pullY = 0;
        let isClose = false;
        let dist = 0;

        // 1. Gentle Nudge attraction physics towards cursor (max 6px)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - dot.baseX;
          const dy = mouse.y - dot.baseY;
          dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            isClose = true;
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);

            // Nudge dot max 6px towards cursor
            const maxNudge = 6.0;
            pullX = Math.cos(angle) * force * maxNudge;
            pullY = Math.sin(angle) * force * maxNudge;
          }
        }

        // 2. Wave Ripple Offset
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
                waveOpacityMultiplier += 0.8 * decay;
              }
            }
          }
        }

        // Smooth Lerp to target position (no velocity accumulation)
        const targetX = dot.baseX + pullX + waveDisplacementX;
        const targetY = dot.baseY + pullY;

        dot.x += (targetX - dot.x) * 0.14;
        dot.y += (targetY - dot.y) * 0.14;

        // Draw Dot
        ctx.beginPath();
        const currentSize = isClose 
          ? dot.size + (1 - dist / mouse.radius) * 0.8 
          : dot.size;
          
        ctx.arc(dot.x, dot.y, currentSize, 0, Math.PI * 2);

        let alpha = isClose ? 0.35 + (1 - dist / mouse.radius) * 0.25 : 0.2;
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

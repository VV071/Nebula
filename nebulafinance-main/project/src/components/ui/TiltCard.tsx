import { useRef, ReactNode } from 'react';
import {
  motion, useMotionValue, useSpring, useTransform, useReducedMotion,
} from 'framer-motion';

/**
 * TiltCard — pointer-tracking 3D glass card.
 *
 * Tilts toward the cursor with spring physics and shows a moving glare
 * highlight. Transform/opacity only (GPU-composited); disables itself
 * under prefers-reduced-motion and on touch-only devices (no hover).
 */

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** max tilt in degrees (default 7) */
  maxTilt?: number;
  /** show the moving glare highlight (default true) */
  glare?: boolean;
  /** lift + scale on hover (default true) */
  lift?: boolean;
  onClick?: () => void;
}

export default function TiltCard({
  children, className = '', style,
  maxTilt = 7, glare = true, lift = true, onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // pointer position, -0.5 … 0.5 within the card
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 260, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [maxTilt, -maxTilt]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-maxTilt, maxTilt]), spring);

  // glare follows the pointer
  const glareX = useTransform(px, [-0.5, 0.5], ['20%', '80%']);
  const glareY = useTransform(py, [-0.5, 0.5], ['15%', '85%']);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)`,
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType === 'touch' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div style={{ perspective: '900px' }} className={onClick ? 'cursor-pointer' : ''}>
      <motion.div
        ref={ref}
        className={className}
        style={{
          ...style,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={lift && !reduced ? { scale: 1.015, y: -3 } : undefined}
        whileTap={onClick && !reduced ? { scale: 0.985 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onClick={onClick}
      >
        {children}
        {glare && !reduced && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{ background: glareBg, mixBlendMode: 'overlay' }}
          />
        )}
      </motion.div>
    </div>
  );
}

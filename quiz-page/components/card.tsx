"use client";
import type { SpringOptions } from 'motion/react';
import { useCallback, useEffect, useRef, memo } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface TiltedCardProps {
  captionText?: string;
  containerHeight?: React.CSSProperties['height'];
  containerWidth?: React.CSSProperties['width'];
  cardHeight?: React.CSSProperties['height'];
  cardWidth?: React.CSSProperties['width'];
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
  cardContent?: React.ReactNode;
  displayOverlayContent?: boolean;
  displayCardContent?: boolean;
}

const springValues: SpringOptions = {
  damping: 20,
  stiffness: 130,
  mass: 0.8
};

function TiltedCard({
  captionText = '',
  containerHeight = '300px',
  containerWidth = '100%',
  cardHeight: cardHeight = '300px',
  cardWidth: cardWidth = '300px',
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = false,
  showTooltip = false,
  overlayContent = null,
  cardContent = null,
  displayOverlayContent = false,
  displayCardContent = false,
}: TiltedCardProps) {
  if (cardContent == null && overlayContent == null) {return (<div></div>)}

  const ref = useRef<HTMLElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 350,
    damping: 30,
    mass: 1
  });

  // const [lastY, setLastY] = useState(0);
  const lastY = useRef(0);

  const frame = useRef<number | null>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;

    const rect = rectRef.current;

    if (!rect) return;

    mouse.current = {
      x: e.clientX,
      y: e.clientY,
    };

  if (frame.current) return;

  frame.current = requestAnimationFrame(() => {
    frame.current = null;

    const rect = rectRef.current!;
    const offsetX = mouse.current.x - rect.left - rect.width / 2;
    const offsetY = mouse.current.y - rect.top - rect.height / 2;

    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);

    const velocityY = offsetY - lastY.current;

    if (showTooltip) {
      x.set(mouse.current.x - rect.left);
      y.set(mouse.current.y - rect.top);
      rotateFigcaption.set(-velocityY * 0.6);
    }
    
    lastY.current = offsetY;
  });
  }, [rotateAmplitude])

  function handleMouseEnter() {
    if (ref.current) {
        rectRef.current = ref.current.getBoundingClientRect();
    }

    scale.set(scaleOnHover);
    opacity.set(1);
}

  function handleMouseLeave() {
    if (showTooltip) {
      opacity.set(0);
      rotateX.set(0);
      rotateY.set(0);
      rotateFigcaption.set(0);
    }
    scale.set(1);
  }

  useEffect(() => {
  return () => {
    if (frame.current) {
      cancelAnimationFrame(frame.current);
    }
  };
}, []);

  return (
    <figure
      ref={ref}
      className="relative w-full h-full perspective-midrange flex flex-col items-center justify-center"
      style={{
        height: containerHeight,
        width: containerWidth
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="absolute top-4 text-center text-sm block sm:hidden">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      )}

      <motion.div
        className="relative transform-3d object-cover rounded-[15px] will-change-transform backface-hidden transform-[translateZ(0)] bg-white "
        style={{
          width: cardWidth,
          height: cardHeight,
          rotateX,
          rotateY,
          scale
        }}
      >

        {displayCardContent && cardContent && (
          <div className="absolute w-full top-0 left-0 z-1 h-full will-change-transform transform-[translateZ(10px)]">
            {cardContent}
          </div>
        )}


        {displayOverlayContent && overlayContent && (
          <motion.div className={`absolute w-full top-0 left-0 z-2 h-full will-change-transform transform-[translateZ(30px)]`}>
            {overlayContent}
          </motion.div>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="pointer-events-none absolute left-0 top-0 rounded-sm bg-white px-2.5 py-1 text-[20px] text-[#2d2d2d] opacity-0 z-3 hidden sm:block"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}

export default memo(TiltedCard)
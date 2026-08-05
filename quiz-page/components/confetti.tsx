"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  mobileParticles?: number;
  desktopParticles?: number;
  className?: string;
  onComplete?: () => void;
}

type Particle = {
  x: number;
  y: number;

  r: number;
  halfR: number;
  quarterR: number;

  d: number;

  color: string;

  tilt: number;
  tiltAngle: number;
  tiltAngleIncrement: number;

  emoji?: HTMLCanvasElement;
};


const COLORS = [
  "DodgerBlue",
  "OliveDrab",
  "Gold",
  "Pink",
  "SlateBlue",
  "LightBlue",
  "Violet",
  "PaleGreen",
  "SteelBlue",
  "SandyBrown",
  "Chocolate",
  "Crimson",
];

const random = (min: number, max: number) =>
  Math.random() * (max - min) + min;

function createEmojiSprite(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d")!;
  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 32, 34);

  return canvas;
}

export default function Confetti({
  mobileParticles = 80,
  desktopParticles = 200,
  className = "",
  onComplete
}: ConfettiProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const partySprite = createEmojiSprite("🎉");
    const crownSprite = createEmojiSprite("👑");

    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };


    resize();

    const isMobile = window.matchMedia(
      "(max-width: 760px)"
    ).matches;

    const MAX_PARTICLES = isMobile
      ? mobileParticles
      : desktopParticles;

    const particles: Particle[] = [];

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const r = random(10, 30);
      particles.push({
          x: random(0, width),
          y: random(-height, 0),

          r,
          halfR: r / 2,
          quarterR: r / 4,

          d: random(10, MAX_PARTICLES),

          color: COLORS[i % COLORS.length],

          tilt: random(-10, 10),
          tiltAngle: random(0, Math.PI * 2),
          tiltAngleIncrement: random(0.05, 0.12),
          emoji:
              Math.random() < 0.25
                  ? Math.random() < 0.5
                      ? partySprite
                      : crownSprite
                  : undefined,
      });

    }

    let angle = 0;
    let animationFrame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const sinAngle = Math.sin(angle);

      let alive = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.emoji) {
          ctx.drawImage(
            p.emoji,
            p.x + p.tilt - p.halfR,
            p.y - p.halfR,
            p.r*2,
            p.r *2
          );
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.halfR;

          ctx.beginPath();
          ctx.moveTo(
              p.x + p.tilt + p.quarterR,
              p.y
          );
          ctx.lineTo(
              p.x + p.tilt,
              p.y + p.tilt + p.quarterR
          );
          ctx.stroke();
        }

        p.y +=
          ((Math.cos(angle + p.d) + 2 + p.halfR) * 2) /
          2.2;

        p.x += sinAngle * 2;

        if (
          p.x > width + 20 ||
          p.x < -20 ||
          p.y > height
        ) {
            continue;
        }

        particles[alive++] = p;
      }

      particles.length = alive;

      angle += 0.01;

      if (alive) {
          animationFrame = requestAnimationFrame(draw);
      } else {
          onComplete?.();
      }
    };


    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [mobileParticles, desktopParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 w-screen h-screen ${className}`}
    />
  );
}
"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  mobileParticles?: number;
  desktopParticles?: number;
  className?: string;
}

type Particle = {
  x: number;
  y: number;
  r: number;
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

      canvas.width = width;
      canvas.height = height;
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
      particles.push({
        x: random(0, width),
        y: random(-height, 0),
        r: random(10, 30),
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

    // One path for each ribbon color
    const ribbonPaths = new Map<
        string,
        { x1: number; y1: number; x2: number; y2: number; lineWidth: number }[]
    >();

    const emojis: Particle[] = [];

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.emoji) {
            emojis.push(p);
        } else {
            let arr = ribbonPaths.get(p.color);

            if (!arr) {
                arr = [];
                ribbonPaths.set(p.color, arr);
            }

            arr.push({
                x1: p.x + p.tilt + p.r / 4,
                y1: p.y,
                x2: p.x + p.tilt,
                y2: p.y + p.tilt + p.r / 4,
                lineWidth: p.r / 2,
            });
        }

        p.y +=
            ((Math.cos(angle + p.d) + 2 + p.r / 2) * 2) /
            2.5;

        p.x += Math.sin(angle) * 2;

        if (
            p.x > width + 20 ||
            p.x < -20 ||
            p.y > height
        ) {
            particles.splice(i, 1);
        }
    }

    // Draw all ribbons grouped by color
    ribbonPaths.forEach((segments, color) => {
        ctx.strokeStyle = color;

        // Ribbon sizes vary, so batch by line width
        const widthGroups = new Map<number, typeof segments>();

        for (const seg of segments) {
            let arr = widthGroups.get(seg.lineWidth);

            if (!arr) {
                arr = [];
                widthGroups.set(seg.lineWidth, arr);
            }

            arr.push(seg);
        }

        widthGroups.forEach((group, lineWidth) => {
            ctx.lineWidth = lineWidth;
            ctx.beginPath();

            for (const s of group) {
                ctx.moveTo(s.x1, s.y1);
                ctx.lineTo(s.x2, s.y2);
            }

            ctx.stroke();
        });
    });

    // Draw emojis
    for (const p of emojis) {
        ctx.drawImage(
            p.emoji!,
            p.x + p.tilt - p.r / 2,
            p.y - p.r / 2,
            p.r,
            p.r
        );
    }

    angle += 0.01;

    if (particles.length > 0) {
        animationFrame = requestAnimationFrame(draw);
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
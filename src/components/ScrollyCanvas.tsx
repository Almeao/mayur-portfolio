'use client';

import { useEffect, useRef, useState, RefObject } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const FRAME_COUNT = 120;

interface Props {
  heroRef: any;
}

export default function ScrollyCanvas({ heroRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  // Parallel image preload
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;

    const getBasePath = () => {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname;
        if (p.startsWith('/mayurr')) return '/mayurr';
        if (window.location.hostname.includes('github.io')) return '/mayurr';
      }
      return process.env.NEXT_PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/mayurr' : '');
    };

    const basePath = getBasePath();

    const promises = Array.from({ length: FRAME_COUNT }, (_, i) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        const padded = (i + 1).toString().padStart(3, '0');
        img.src = `${basePath}/sequence/ezgif-frame-${padded}.png`;
        const done = () => {
          if (cancelled) return;
          loadedCount++;
          setImagesLoaded(loadedCount);
          // Trigger immediate draw of initial frame as soon as frame 0 or 1 loads
          if (i === 0 || loadedCount === 1) {
            drawImage(0);
          }
          resolve(img);
        };
        img.onload = done;
        img.onerror = done;
        imagesRef.current[i] = img;
      });
    });

    Promise.all(promises);
    return () => {
      cancelled = true;
    };
  }, []);

  const drawImage = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let img = imagesRef.current[index];

    // Fallback: If target frame isn't loaded yet (due to large 222MB sequence download over GitHub Pages),
    // find the nearest loaded frame so canvas is NEVER blank or black!
    if (!img || !img.complete || img.naturalWidth === 0) {
      let found: HTMLImageElement | null = null;
      for (let offset = 1; offset < FRAME_COUNT; offset++) {
        const prevIndex = index - offset;
        if (prevIndex >= 0) {
          const prev = imagesRef.current[prevIndex];
          if (prev && prev.complete && prev.naturalWidth > 0) {
            found = prev;
            break;
          }
        }
        const nextIndex = index + offset;
        if (nextIndex < FRAME_COUNT) {
          const next = imagesRef.current[nextIndex];
          if (next && next.complete && next.naturalWidth > 0) {
            found = next;
            break;
          }
        }
      }
      if (!found) return;
      img = found;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }

    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = canvas.width / 2 - (img.width / 2) * scale;
    const y = canvas.height / 2 - (img.height / 2) * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  };

  useEffect(() => {
    if (imagesLoaded > 0) drawImage(Math.round(frameIndex.get()));
  }, [imagesLoaded, frameIndex]);

  useEffect(() => {
    const handleResize = () => drawImage(Math.round(frameIndex.get()));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [frameIndex]);

  useMotionValueEvent(frameIndex, 'change', (latest) => {
    requestAnimationFrame(() => drawImage(Math.round(latest)));
  });

  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
      {imagesLoaded < 5 && (
        <div className="absolute inset-0 z-50 bg-[#0d0d0d] flex items-center justify-center text-white text-sm font-mono tracking-widest">
          LOADING {Math.floor((imagesLoaded / FRAME_COUNT) * 100)}%
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

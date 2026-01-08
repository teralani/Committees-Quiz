'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Question = {
  text: string;
  options: { text: string; weights: number[]; range?: number }[];
  slider?: boolean;
  max?: number;
};

type Props = {
  question: Question;
  outerClassName?: string;
  onChange: (ranges: number[]) => void;
};

function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function normalizeRanges(options: Question['options'], max: number) {
  const res = options.map((o) => (typeof o.range === 'number' ? Math.round(o.range) : NaN));
  for (let i = 0; i < res.length; i++) {
    if (Number.isNaN(res[i])) {
      res[i] = i === 0 ? 0 : Math.min(max, (res[i - 1] ?? 0) + 1);
    }
    if (i > 0 && res[i] <= res[i - 1]) res[i] = Math.min(max, res[i - 1] + 1);
    res[i] = Math.max(0, Math.min(max, res[i]));
  }
  return res;
}

export default function CustomMultiSlider({ question, onChange, outerClassName }: Props) {
  const max = question.max ?? 100;

  const normalized = normalizeRanges(question.options, max);
  const [values, setValues] = useState<number[]>(normalized);
  const [selected, setSelected] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync when question/options change. If any option lacked a range, populate parent with defaults.
  useEffect(() => {
    setValues(normalized);
    const missing = question.options.some((o) => typeof o.range !== 'number');
    if (missing) {
      onChange(normalized);
    }
    // We stringify `normalized` to avoid array identity causing extra runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(normalized), onChange]);

  // Notify parent when the user changes knobs (values differ from normalized).
  useEffect(() => {
    if (!arraysEqual(values, normalized)) {
      onChange(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const updateValue = useCallback(
    (index: number, newVal: number) => {
      setValues((prev) => {
        const next = prev.slice();
        const minAllowed = index > 0 ? next[index - 1] + 1 : 0;
        const maxAllowed = index < next.length - 1 ? next[index + 1] - 1 : max;
        next[index] = Math.max(minAllowed, Math.min(newVal, maxAllowed));
        return next;
      });
    },
    [max]
  );

  const startDrag = (index: number, _event: React.MouseEvent) => {
    setSelected(index);
    const move = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      updateValue(index, Math.round(pct * max));
    };
    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
      setSelected(null);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
  };

  return (
    <div className={`slider-root ${outerClassName ?? ''}`}>
      <div ref={trackRef} className="slider-track relative h-4 rounded-full bg-[#ccc]">
        {values.map((val, i) => {
          const leftPct = (val / max) * 100;
          const rightPct = i < values.length - 1 ? (values[i + 1] / max) * 100 : 100;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                width: `${rightPct - leftPct}%`,
                height: '100%',
                background: ['#4f46e5', '#10b981', '#f59e0b'][i % 3],
              }}
            />
          );
        })}

        {values.map((value, i) => (
          <div
            key={i}
            className={`${i === selected ? 'z-50' : 'z-0'} slider-thumb absolute top-1/2 w-4 h-4 rounded-full bg-black cursor-grab`}
            style={{
              left: `${(value / max) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseDown={(e) => startDrag(i, e)}
          >
            <div
              className={`${i === selected ? 'z-50' : 'z-0'} border-white border-2 absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-sm bg-black text-white text-md whitespace-nowrap`}
              style={{ transform: 'translateX(-50%)' }}
            >
              {question.options[i]?.text ?? ''}≤ {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
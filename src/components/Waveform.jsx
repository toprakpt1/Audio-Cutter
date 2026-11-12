import { useCallback, useEffect, useRef } from 'react';
import { formatTime } from '../lib/format.js';

export const MIN_SELECTION = 0.02;

const COLOR_OUTSIDE = '#34343c';
const COLOR_INSIDE = '#e9a23b';
const COLOR_AXIS = '#17171b';
const COLOR_TINT = 'rgba(233, 162, 59, 0.055)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function Waveform({ peaks, duration, start, end, position, onChange, lang, labels }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const draw = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !peaks || duration <= 0) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const step = 4;
    const barWidth = 2;
    const centerY = height / 2;
    const halfHeight = Math.max(10, height / 2 - 10);
    const columns = Math.max(1, Math.floor(width / step));
    const selectionStartX = (start / duration) * width;
    const selectionEndX = (end / duration) * width;

    ctx.fillStyle = COLOR_AXIS;
    ctx.fillRect(0, centerY - 0.5, width, 1);

    if (selectionEndX > selectionStartX) {
      ctx.fillStyle = COLOR_TINT;
      ctx.fillRect(selectionStartX, 0, selectionEndX - selectionStartX, height);
    }

    for (let i = 0; i < columns; i++) {
      const peakIndex = Math.min(peaks.length - 1, Math.floor((i / columns) * peaks.length));
      const amplitude = Math.pow(peaks[peakIndex], 0.72);
      const barHeight = Math.max(1.2, amplitude * halfHeight);
      const x = i * step;
      const isInside = x + barWidth / 2 >= selectionStartX && x + barWidth / 2 <= selectionEndX;
      ctx.fillStyle = isInside ? COLOR_INSIDE : COLOR_OUTSIDE;
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
    }
  }, [peaks, duration, start, end]);

  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
    draw();
  }, [draw]);

  // Gözlemci bir kez kurulur; çizim fonksiyonu ref üzerinden güncel kalır.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(() => drawRef.current());
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const timeAt = (clientX) => {
    const rect = stageRef.current.getBoundingClientRect();
    if (!rect.width) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  };

  const handleStageDown = (event) => {
    if (event.button !== 0 || !duration) return;
    if (event.target.closest('.handle')) return;
    const time = timeAt(event.clientX);
    const inside = time > start && time < end;

    if (inside) {
      dragRef.current = { mode: 'move', grab: time - start, width: end - start, prev: { start, end } };
    } else {
      dragRef.current = { mode: 'select', anchor: time, prev: { start, end } };
      onChange({ start: time, end: time });
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleStageMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const time = timeAt(event.clientX);

    if (drag.mode === 'move') {
      const next = clamp(time - drag.grab, 0, Math.max(0, duration - drag.width));
      drag.last = { start: next, end: next + drag.width };
      onChange(drag.last);
    } else if (drag.mode === 'select') {
      drag.last = { start: Math.min(drag.anchor, time), end: Math.max(drag.anchor, time) };
      onChange(drag.last);
    }
  };

  const handleStageUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const last = drag.last ?? { start, end };
    if (drag.mode === 'select' && last.end - last.start < MIN_SELECTION) {
      onChange(drag.prev);
    }
  };

  const handleHandleDown = (which) => (event) => {
    if (event.button !== 0 || !duration) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { mode: which, prev: { start, end } };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleHandleMove = (event) => {
    const drag = dragRef.current;
    if (!drag || (drag.mode !== 'start' && drag.mode !== 'end')) return;
    const time = timeAt(event.clientX);

    if (drag.mode === 'start') {
      onChange({ start: clamp(time, 0, end - MIN_SELECTION), end });
    } else {
      onChange({ start, end: clamp(time, start + MIN_SELECTION, duration) });
    }
  };

  const handleHandleUp = () => {
    dragRef.current = null;
  };

  const handleKey = (which) => (event) => {
    const step = event.shiftKey ? 0.5 : 0.02;
    let value = which === 'start' ? start : end;

    switch (event.key) {
      case 'ArrowLeft':
        value -= step;
        break;
      case 'ArrowRight':
        value += step;
        break;
      case 'Home':
        value = which === 'start' ? 0 : start + MIN_SELECTION;
        break;
      case 'End':
        value = which === 'start' ? end - MIN_SELECTION : duration;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (which === 'start') {
      onChange({ start: clamp(value, 0, end - MIN_SELECTION), end });
    } else {
      onChange({ start, end: clamp(value, start + MIN_SELECTION, duration) });
    }
  };

  const percentPerSecond = duration > 0 ? 100 / duration : 0;
  const playheadPercent = position == null ? null : clamp(position * percentPerSecond, 0, 100);

  return (
    <div
      className="stage"
      ref={stageRef}
      onPointerDown={handleStageDown}
      onPointerMove={handleStageMove}
      onPointerUp={handleStageUp}
      onPointerCancel={handleStageUp}
    >
      <canvas ref={canvasRef} />
      {playheadPercent !== null && (
        <div className="playhead" style={{ left: `${playheadPercent}%` }} aria-hidden="true" />
      )}
      <div
        className="handle"
        style={{ left: `${clamp(start * percentPerSecond, 0, 100)}%` }}
        role="slider"
        tabIndex={0}
        aria-label={labels.startPoint}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={Number(end.toFixed(2))}
        aria-valuenow={Number(start.toFixed(2))}
        aria-valuetext={formatTime(start, lang)}
        onPointerDown={handleHandleDown('start')}
        onPointerMove={handleHandleMove}
        onPointerUp={handleHandleUp}
        onPointerCancel={handleHandleUp}
        onKeyDown={handleKey('start')}
      />
      <div
        className="handle"
        style={{ left: `${clamp(end * percentPerSecond, 0, 100)}%` }}
        role="slider"
        tabIndex={0}
        aria-label={labels.endPoint}
        aria-orientation="horizontal"
        aria-valuemin={Number(start.toFixed(2))}
        aria-valuemax={Number(duration.toFixed(2))}
        aria-valuenow={Number(end.toFixed(2))}
        aria-valuetext={formatTime(end, lang)}
        onPointerDown={handleHandleDown('end')}
        onPointerMove={handleHandleMove}
        onPointerUp={handleHandleUp}
        onPointerCancel={handleHandleUp}
        onKeyDown={handleKey('end')}
      />
    </div>
  );
}

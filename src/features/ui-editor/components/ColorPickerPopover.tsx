'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  splitColorAlpha,
  mergeColorAlpha,
} from '@/lib/colorUtils';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const SV_SIZE = 180;
const HUE_WIDTH = 16;
const HUE_HEIGHT = SV_SIZE;
const ALPHA_HEIGHT = 16;
const GAP = 8;

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface ColorPickerPopoverProps {
  /** Current color value: #rrggbb or #rrggbbaa */
  value: string | undefined;
  onChange: (value: string) => void;
  /** Show alpha slider */
  showAlpha?: boolean;
  /** Trigger element */
  children: React.ReactNode;
}

export function ColorPickerPopover({
  value,
  onChange,
  showAlpha = false,
  children,
}: ColorPickerPopoverProps) {
  const { hex6, alpha } = splitColorAlpha(value);
  const rgb = hexToRgb(hex6);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  const [hue, setHue] = useState(hsv.h);
  const [sat, setSat] = useState(hsv.s);
  const [val, setVal] = useState(hsv.v);
  const [currentAlpha, setCurrentAlpha] = useState(alpha);
  const [hexInput, setHexInput] = useState(value ?? '#ffffff');

  // Sync internal state when value prop changes externally
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      const { hex6: h6, alpha: a } = splitColorAlpha(value);
      const r = hexToRgb(h6);
      const hsvNew = rgbToHsv(r.r, r.g, r.b);
      // Only update hue if saturation/value > 0 (avoid hue jump on grays)
      if (hsvNew.s > 0.01 && hsvNew.v > 0.01) {
        setHue(hsvNew.h);
      }
      setSat(hsvNew.s);
      setVal(hsvNew.v);
      setCurrentAlpha(a);
      setHexInput(value ?? '#ffffff');
    }
  }, [value]);

  const emitChange = useCallback(
    (h: number, s: number, v: number, a: number) => {
      const { r, g, b } = hsvToRgb(h, s, v);
      const hex6New = rgbToHex(r, g, b);
      const merged = showAlpha ? mergeColorAlpha(hex6New, a) : hex6New;
      setHexInput(merged);
      prevValueRef.current = merged;
      onChange(merged);
    },
    [onChange, showAlpha]
  );

  const handleSVChange = useCallback(
    (s: number, v: number) => {
      setSat(s);
      setVal(v);
      emitChange(hue, s, v, currentAlpha);
    },
    [hue, currentAlpha, emitChange]
  );

  const handleHueChange = useCallback(
    (h: number) => {
      setHue(h);
      emitChange(h, sat, val, currentAlpha);
    },
    [sat, val, currentAlpha, emitChange]
  );

  const handleAlphaChange = useCallback(
    (a: number) => {
      setCurrentAlpha(a);
      emitChange(hue, sat, val, a);
    },
    [hue, sat, val, emitChange]
  );

  const handleHexCommit = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed.startsWith('#')) return;
      const bare = trimmed.slice(1);
      if (bare.length !== 6 && bare.length !== 8 && bare.length !== 3) return;

      const { hex6: h6, alpha: a } = splitColorAlpha(trimmed);
      const r = hexToRgb(h6);
      const hsvNew = rgbToHsv(r.r, r.g, r.b);
      if (hsvNew.s > 0.01 && hsvNew.v > 0.01) {
        setHue(hsvNew.h);
      }
      setSat(hsvNew.s);
      setVal(hsvNew.v);
      if (showAlpha) setCurrentAlpha(a);
      setHexInput(trimmed);
      prevValueRef.current = trimmed;
      onChange(trimmed);
    },
    [onChange, showAlpha]
  );

  // Current color for preview
  const currentRgb = hsvToRgb(hue, sat, val);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  const totalWidth = SV_SIZE + GAP + HUE_WIDTH;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-3"
        style={{ width: totalWidth + 24 }}
        align="start"
        sideOffset={6}
      >
        <div className="flex flex-col" style={{ gap: GAP }}>
          {/* SV square + Hue bar */}
          <div className="flex" style={{ gap: GAP }}>
            <SVCanvas
              hue={hue}
              saturation={sat}
              brightness={val}
              onChange={handleSVChange}
            />
            <HueCanvas hue={hue} onChange={handleHueChange} />
          </div>

          {/* Alpha bar */}
          {showAlpha && (
            <AlphaCanvas
              hex6={currentHex}
              alpha={currentAlpha}
              onChange={handleAlphaChange}
              width={totalWidth}
            />
          )}

          {/* Preview + Hex input */}
          <div className="flex items-center" style={{ gap: GAP }}>
            <div
              className="relative shrink-0 overflow-hidden rounded border"
              style={{ width: 32, height: 32 }}
            >
              <Checkerboard />
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: currentHex,
                  opacity: showAlpha ? currentAlpha : 1,
                }}
              />
            </div>
            <Input
              className="h-7 flex-1 font-mono text-xs"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={(e) => handleHexCommit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleHexCommit((e.target as HTMLInputElement).value);
              }}
              placeholder={showAlpha ? '#rrggbbaa' : '#rrggbb'}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ──────────────────────────────────────────────
// SV (Saturation/Value) Canvas
// ──────────────────────────────────────────────

function SVCanvas({
  hue,
  saturation,
  brightness,
  onChange,
}: {
  hue: number;
  saturation: number;
  brightness: number;
  onChange: (s: number, v: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw SV gradient
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = SV_SIZE;
    const h = SV_SIZE;

    // Base hue color
    const { r, g, b } = hsvToRgb(hue, 1, 1);

    // White → Hue (horizontal)
    const gradH = ctx.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0, '#ffffff');
    gradH.addColorStop(1, `rgb(${r},${g},${b})`);
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, w, h);

    // Transparent → Black (vertical)
    const gradV = ctx.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, w, h);

    // Crosshair marker
    const mx = saturation * w;
    const my = (1 - brightness) * h;
    ctx.strokeStyle = brightness > 0.5 ? '#000' : '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.stroke();
  }, [hue, saturation, brightness]);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      onChange(x, 1 - y);
    },
    [onChange]
  );

  return (
    <canvas
      ref={canvasRef}
      width={SV_SIZE}
      height={SV_SIZE}
      className="cursor-crosshair rounded"
      style={{ width: SV_SIZE, height: SV_SIZE }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Hue Canvas (vertical rainbow bar)
// ──────────────────────────────────────────────

function HueCanvas({
  hue,
  onChange,
}: {
  hue: number;
  onChange: (h: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = HUE_WIDTH;
    const h = HUE_HEIGHT;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ff0000');
    grad.addColorStop(1 / 6, '#ffff00');
    grad.addColorStop(2 / 6, '#00ff00');
    grad.addColorStop(3 / 6, '#00ffff');
    grad.addColorStop(4 / 6, '#0000ff');
    grad.addColorStop(5 / 6, '#ff00ff');
    grad.addColorStop(1, '#ff0000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Marker
    const my = (hue / 360) * h;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, my - 2, w, 4);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, my - 2, w, 4);
  }, [hue]);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      onChange(y * 360);
    },
    [onChange]
  );

  return (
    <canvas
      ref={canvasRef}
      width={HUE_WIDTH}
      height={HUE_HEIGHT}
      className="cursor-pointer rounded"
      style={{ width: HUE_WIDTH, height: HUE_HEIGHT }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Alpha Canvas (horizontal bar)
// ──────────────────────────────────────────────

function AlphaCanvas({
  hex6,
  alpha,
  onChange,
  width,
}: {
  hex6: string;
  alpha: number;
  onChange: (a: number) => void;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = width;
    const h = ALPHA_HEIGHT;

    // Checkerboard
    const checkSize = 6;
    for (let cy = 0; cy < h; cy += checkSize) {
      for (let cx = 0; cx < w; cx += checkSize) {
        const isLight = ((cx / checkSize + cy / checkSize) % 2) === 0;
        ctx.fillStyle = isLight ? '#ccc' : '#fff';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    // Color gradient: transparent → solid
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, hex6 + '00');
    grad.addColorStop(1, hex6);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Marker
    const mx = alpha * w;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx - 2, 0, 4, h);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 2, 0, 4, h);
  }, [hex6, alpha, width]);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onChange(x);
    },
    [onChange]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={ALPHA_HEIGHT}
      className="cursor-pointer rounded"
      style={{ width, height: ALPHA_HEIGHT }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Checkerboard background (CSS)
// ──────────────────────────────────────────────

function Checkerboard() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
      }}
    />
  );
}

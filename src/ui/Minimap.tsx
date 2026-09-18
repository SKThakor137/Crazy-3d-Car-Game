import React, { useRef, useEffect, useMemo } from 'react';
import { useGame } from '../game/GameStateContext';
import { TRACKS_DATA } from '../data/TrackConfigs';
import { MathUtils } from '../utils/MathUtils';
import { TelemetryStore } from '../game/TelemetryStore';

export const Minimap: React.FC = () => {
  const { selectedTrackId } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackConfig = TRACKS_DATA[selectedTrackId] || TRACKS_DATA['neon-city'];

  // Precompute spline and projection matrix
  const { spline, project, cachedTrackOutline } = useMemo(() => {
    const s = MathUtils.createTrackSpline(trackConfig.controlPoints);
    const points = trackConfig.controlPoints;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    points.forEach(p => {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[2]);
      maxZ = Math.max(maxZ, p[2]);
    });

    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const width = 160;
    const height = 160;
    const padding = 20;
    const scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeZ);

    const proj = (x: number, z: number) => ({
      x: padding + (x - minX) * scale + (width - padding * 2 - rangeX * scale) / 2,
      y: padding + (z - minZ) * scale + (height - padding * 2 - rangeZ * scale) / 2,
    });

    // Pre-calculate track outline points
    const divisions = 100;
    const outlinePoints: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= divisions; i++) {
      const pt = s.getPointAt(i / divisions);
      outlinePoints.push(proj(pt.x, pt.z));
    }

    const startPt = s.getPointAt(0);
    const startProj = proj(startPt.x, startPt.z);

    return { spline: s, project: proj, cachedTrackOutline: { points: outlinePoints, start: startProj } };
  }, [trackConfig]);

  // Smooth 30 FPS direct Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      // Limit to 30 FPS for battery / CPU efficiency
      if (time - lastTime < 33) return;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw track outline
      const pts = cachedTrackOutline.points;
      if (pts.length > 0) {
        // Underglow
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle =
          trackConfig.theme === 'beach' ? 'rgba(0, 229, 255, 0.4)' :
          trackConfig.theme === 'forest' ? 'rgba(74, 222, 128, 0.4)' :
          'rgba(251, 146, 60, 0.4)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Core line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle =
          trackConfig.theme === 'beach' ? '#00e5ff' :
          trackConfig.theme === 'forest' ? '#4ade80' :
          '#fb923c';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Start / Finish line dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cachedTrackOutline.start.x, cachedTrackOutline.start.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Racers
      const racers = TelemetryStore.racers;
      if (racers && racers.length > 0) {
        racers.forEach(racer => {
          let t = racer.splineT % 1.0;
          if (t < 0) t += 1.0;
          const pt = spline.getPointAt(t);
          const p = project(pt.x, pt.z);

          if (racer.isPlayer) {
            // Player: Glowing neon cyan dot with white outer ring
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            // AI: Distinct colored dot
            ctx.shadowBlur = 0;
            ctx.fillStyle = racer.color || '#ff4444';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } else {
        // If racers haven't populated yet, draw player dot at start
        const startP = cachedTrackOutline.start;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(startP.x, startP.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cachedTrackOutline, project, spline, trackConfig.theme]);

  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 arcade-glass rounded-2xl p-1.5 shadow-2xl border border-cyan-500/30">
      <div className="absolute top-1.5 left-2.5 text-[9px] font-arcade font-bold tracking-widest text-cyan-400 opacity-80 pointer-events-none">
        GPS RADAR
      </div>
      <canvas
        ref={canvasRef}
        width={160}
        height={160}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

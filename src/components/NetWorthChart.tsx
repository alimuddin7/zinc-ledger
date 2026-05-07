import React, { useState, useCallback } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
}

interface NetWorthChartProps {
  data: DataPoint[];
  height?: number;
}

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} Mlyr`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(1)} Rb`;
  return `Rp ${n.toFixed(0)}`;
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
}

function buildPath(
  points: { x: number; y: number }[],
  close: boolean,
  chartH: number
): string {
  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }

  if (close) {
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    d += ` L ${lastX} ${chartH} L ${firstX} ${chartH} Z`;
  }

  return d;
}

export function NetWorthChart({ data, height = 200 }: NetWorthChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  if (data.length === 0) {
    return (
      <View className="items-center justify-center" style={{ height }}>
        <Text className="text-sm text-white/20 text-center font-inter-medium">No trend data available yet.</Text>
      </View>
    );
  }

  const padX = 10;
  const padY = 30;
  const chartW = Math.max(containerWidth - padX * 2, 100);
  const chartH = height - padY * 2;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const linePath = buildPath(points, false, chartH + padY);
  const areaPath = buildPath(points, true, chartH + padY);

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  const handleTouch = (evt: { nativeEvent: { locationX: number } }) => {
    const x = evt.nativeEvent.locationX;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - x);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  };

  const trendColor = '#8b5cf6'; // Violet 500 — FinTech theme

  return (
    <View 
      className="overflow-hidden" 
      onLayout={onLayout}
      onTouchStart={(e) => handleTouch({ nativeEvent: { locationX: e.nativeEvent.locationX } })}
      onTouchMove={(e) => handleTouch({ nativeEvent: { locationX: e.nativeEvent.locationX } })}
      onTouchEnd={() => setActiveIndex(null)}
    >
      {/* Tooltip Overlay */}
      {active && activePoint && (
        <View 
          className="absolute top-4 z-10 bg-white dark:bg-zinc-800 rounded-2xl px-4 py-2 border border-zinc-200 dark:border-zinc-700"
          style={{ 
            left: Math.min(Math.max(padX, activePoint.x - 60), containerWidth - 130),
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
          }}
        >
          <Text className="text-zinc-900 dark:text-white font-mono-bold text-xs">{formatCurrency(active.value)}</Text>
          <Text className="text-zinc-400 text-[9px] uppercase tracking-wider mt-0.5">{formatDate(active.date)}</Text>
        </View>
      )}

      {containerWidth > 0 && (
        <Svg width={containerWidth} height={height}>
          <Defs>
            <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={trendColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={trendColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          <Path d={areaPath} fill="url(#chartGrad)" />
          <Path d={linePath} stroke={trendColor} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {activePoint && (
            <>
              <Line
                x1={activePoint.x} y1={padY}
                x2={activePoint.x} y2={chartH + padY}
                stroke="#a78bfa" strokeWidth={1} strokeDasharray="5,5" opacity={0.3}
              />
              <Circle cx={activePoint.x} cy={activePoint.y} r={5} fill="#7c3aed" />
              <Circle cx={activePoint.x} cy={activePoint.y} r={12} fill={trendColor} opacity={0.3} />
            </>
          )}
        </Svg>
      )}
    </View>
  );
}

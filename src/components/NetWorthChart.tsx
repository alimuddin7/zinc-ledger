/**
 * NetWorthChart — Custom SVG line chart with gradient fill.
 * Uses react-native-svg. Supports touch scrubbing on web/native.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, LayoutChangeEvent, useColorScheme } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Rect } from 'react-native-svg';

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

/**
 * Build a linear SVG path from data points.
 */
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
  const isDark = useColorScheme() === 'dark';

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  if (data.length === 0) {
    return (
      <View className="bg-white dark:bg-zinc-900 rounded-2xl p-10 items-center justify-center border border-zinc-200 dark:border-zinc-800" style={{ height }}>
        <Text className="text-sm text-zinc-400 dark:text-zinc-500 text-center">No data yet. Calibrate your balances to see trends.</Text>
      </View>
    );
  }

  const padX = 8;
  const padY = 20;
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

  const latestValue = data[data.length - 1].value;
  const firstValue = data[0].value;
  const isUp = latestValue >= firstValue;
  const trendColor = isUp ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fb7185' : '#e11d48');

  return (
    <View 
      className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800" 
      onLayout={onLayout}
      onTouchStart={(e) => handleTouch({ nativeEvent: { locationX: e.nativeEvent.locationX } })}
      onTouchMove={(e) => handleTouch({ nativeEvent: { locationX: e.nativeEvent.locationX } })}
    >
      {/* Scrub tooltip */}
      {active && activePoint && (
        <View 
          className="absolute top-1 z-10 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 border border-zinc-200 dark:border-zinc-700"
          style={{ left: Math.min(Math.max(0, activePoint.x - 50), containerWidth - 100) }}
        >
          <Text className="text-sky-600 dark:text-sky-400 text-[11px] font-mono-bold">{formatCurrency(active.value)}</Text>
          <Text className="text-zinc-400 dark:text-zinc-500 text-[9px]">{formatDate(active.date)}</Text>
        </View>
      )}

      {containerWidth > 0 && (
        <Svg width={containerWidth} height={height}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={trendColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={trendColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <Path d={linePath} stroke={trendColor} strokeWidth={2} fill="none" strokeLinecap="round" />

          {/* Active indicator */}
          {activePoint && (
            <>
              <Line
                x1={activePoint.x} y1={padY}
                x2={activePoint.x} y2={chartH + padY}
                stroke={isDark ? '#71717a' : '#d4d4d8'} strokeWidth={1} strokeDasharray="4,4" opacity={0.5}
              />
              <Circle cx={activePoint.x} cy={activePoint.y} r={4} fill={trendColor} />
              <Circle cx={activePoint.x} cy={activePoint.y} r={8} fill={trendColor} opacity={0.2} />
            </>
          )}

          {/* Transparent area background (no longer used for events to avoid web warnings) */}
          <Rect
            x={0} y={0} width={containerWidth} height={height}
            fill="transparent"
          />
        </Svg>
      )}
    </View>
  );
}

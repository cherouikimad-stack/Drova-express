/**
 * DROVA High-Density Stat Card
 * Modern dark aesthetic with tabular figures and hairline borders
 */
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-[#141414] border transition-colors ${
        highlight
          ? 'border-[#FF0000]/40 bg-[#161212]'
          : 'border-[#262626] hover:border-[#383838]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between text-xs text-[#8E8E93] mb-2">
        <span className="font-medium truncate">{title}</span>
        {icon && <div className="text-[#8E8E93] shrink-0">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono-data text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span className="text-xs font-mono-data text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#545458] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

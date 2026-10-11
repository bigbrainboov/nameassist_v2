/* SIRI.DEV */
import React from 'react';

interface StampSealProps {
  text?: string;
  subtext?: string;
  centerText?: string;
  variant?: 'red' | 'green' | 'navy';
  rotation?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StampSeal: React.FC<StampSealProps> = ({
  text = 'HIGH COURT OF JUSTICE',
  subtext = 'COMMISSIONER FOR OATHS',
  centerText = 'VERIFIED',
  variant = 'red',
  rotation = -3,
  size = 'md',
  className = ''
}) => {
  const colorClass =
    variant === 'green'
      ? 'text-[#006747] border-[#006747]'
      : variant === 'navy'
      ? 'text-[#12352C] border-[#12352C]'
      : 'text-[#A63A2C] border-[#A63A2C]';

  const sizeDimensions = {
    sm: 'w-16 h-16 text-[8px]',
    md: 'w-24 h-24 text-[10px]',
    lg: 'w-32 h-32 text-[12px]'
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-label={`${centerText} official seal`}
    >
      <div
        className={`${sizeDimensions} rounded-full border-2 border-dashed p-1 flex items-center justify-center ${colorClass} transition-transform hover:rotate-0`}
        style={{
          boxShadow: 'inset 0 0 4px currentColor',
          filter: 'contrast(1.15) opacity(0.92)'
        }}
      >
        <div className="w-full h-full rounded-full border border-solid flex flex-col items-center justify-center p-1 text-center font-sans tracking-tight">
          <span className="text-[7px] md:text-[8px] font-semibold uppercase tracking-wider leading-none opacity-90 px-1">
            {text}
          </span>
          <div className="my-0.5 border-t border-b border-current py-0.5 w-4/5 text-center">
            <span className="text-[9px] md:text-[11px] font-display font-bold tracking-widest uppercase block leading-tight">
              {centerText}
            </span>
          </div>
          <span className="text-[6px] md:text-[7px] uppercase tracking-wider opacity-85 leading-none px-1">
            {subtext}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ComingSoonButtonProps {
  name: string;
  description: string;
  position: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ComingSoonButton({ name, description, position, children, className = '', style }: ComingSoonButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer opacity-60 hover:opacity-80 transition-opacity filter grayscale-[25%] active:scale-[0.98] ${className}`}
        style={style}
        role="button"
        aria-label={`${name} (추가 예정)`}
      >
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div 
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-title-md font-bold">{name}</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-on-surface">
              <p className="text-body-lg font-semibold leading-relaxed">
                이 기능은 현재 준비 중입니다.<br />
                Gowith의 다음 버전에서 순차적으로 제공될 예정입니다.
              </p>
              
              <div className="bg-surface-container-low rounded-xl p-4 text-body-sm space-y-2 border border-outline-variant/30 text-on-surface-variant">
                <div>
                  <span className="font-bold text-primary mr-2">기능 설명:</span>
                  {description}
                </div>
                <div>
                  <span className="font-bold text-primary mr-2">표시 위치:</span>
                  {position}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 text-body-sm w-full sm:w-auto"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

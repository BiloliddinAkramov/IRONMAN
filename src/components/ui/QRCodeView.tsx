import React, { useState } from 'react';
import { QrCode, ExternalLink, Copy, Check } from 'lucide-react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&format=svg&data=${encodeURIComponent(
    value
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
      <div
        className="relative bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden"
        style={{ width: size + 16, height: size + 16 }}
      >
        {!imgError ? (
          <img
            src={qrImageUrl}
            alt="Mobile Quick Access QR Code"
            width={size}
            height={size}
            className="rounded-lg object-contain"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3 text-slate-400">
            <QrCode className="w-12 h-12 mb-2 text-slate-300" />
            <span className="text-[11px] font-mono break-all line-clamp-3 text-slate-600">
              {value}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full justify-center">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="Havolani nusxalash"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Havola nusxalandi' : 'Havolani nusxalash'}</span>
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';

interface RevokeButtonProps {
  onConfirmRevoke: () => Promise<void> | void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
}

export function RevokeButton({
  onConfirmRevoke,
  disabled = false,
  isLoading = false,
  label = 'Revoke Mandate',
}: RevokeButtonProps) {
  const [armed, setArmed] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleArm = () => {
    setShaking(true);
    setArmed(true);
    window.setTimeout(() => setShaking(false), 500);
  };

  if (!armed) {
    return (
      <button
        type="button"
        onClick={handleArm}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#D64550] hover:bg-[#BD343F] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          shaking ? 'animate-zf-shake' : ''
        }`}
      >
        <ShieldOff className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 p-1 rounded-lg bg-[#FDE8E9] border border-[#F8C6CA] ${
        shaking ? 'animate-zf-shake' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={isLoading}
        className="h-8 px-3 rounded-md bg-white border border-[#CBD5E1] text-[#1F2A37] hover:bg-[#F1F5F9] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={async () => {
          await onConfirmRevoke();
          setArmed(false);
        }}
        disabled={disabled || isLoading}
        className="h-8 px-3 rounded-md bg-[#D64550] hover:bg-[#BD343F] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
      >
        {isLoading ? 'Revoking...' : 'Confirm Revoke'}
      </button>
    </div>
  );
}

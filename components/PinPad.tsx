'use client';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export default function PinPad({ value, onChange, maxLength = 4, disabled }: PinPadProps) {
  const addDigit = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  };

  const backspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < value.length
                ? 'border-[#e8c547] bg-[#e8c547]'
                : 'border-[#f6f1e3]/30 bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} />;
          }

          if (digit === 'del') {
            return (
              <button
                key={index}
                type="button"
                disabled={disabled || value.length === 0}
                onClick={backspace}
                className="flex min-h-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-lg font-black text-[#f6f1e3]/75 transition hover:bg-white/10 disabled:opacity-40"
              >
                Delete
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              disabled={disabled || value.length >= maxLength}
              onClick={() => addDigit(digit)}
              className="flex min-h-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl font-black text-white transition hover:border-[#e8c547]/50 hover:bg-[#e8c547]/10 disabled:opacity-40"
            >
              {digit}
            </button>
          );
        })}
      </div>
    </div>
  );
}

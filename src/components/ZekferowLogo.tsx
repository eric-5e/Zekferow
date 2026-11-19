interface ZekferowLogoProps {
  size?: number;
  className?: string;
}

export function ZekferowLogo({ size = 32, className = '' }: ZekferowLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#1F2A37" />
      <path
        d="M17 20H47L24 44H47"
        stroke="#FFFFFF"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 20H47V31"
        stroke="#0F9D8F"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="44" r="3.5" fill="#0F9D8F" />
    </svg>
  );
}

export default function Logo({
  size = 34,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="40" height="40" rx="10" className="fill-card" />
      <circle cx="20" cy="20" r="9.5" stroke="var(--color-gold)" strokeWidth="2.6" />
      <path
        d="M7 20h7.4l2.7-5.6 3.5 11.2 2.7-5.6H33"
        stroke="var(--color-mint)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

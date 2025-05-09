import type { SVGProps } from 'react';

export default function VisionSpendLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <title>VisionSpend Logo</title>
      <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="hsl(var(--primary))" strokeOpacity="0.7" />
      <path d="M9 14.5L12 11.5L15 14.5" stroke="hsl(var(--primary))" />
      <path d="M12 7.5V11.5" stroke="hsl(var(--primary))" />
      <circle cx="12" cy="12" r="2" fill="hsl(var(--primary))" />
    </svg>
  );
}

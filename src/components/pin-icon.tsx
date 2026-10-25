/**
 * The location mark: line art, unlike the filled brand marks in
 * brand-icons.tsx, because it labels a fact rather than standing for a
 * company. Colour comes from the text around it (currentColor), so it always
 * matches the line it introduces.
 *
 * Shared by the contact page's details and the role line on About, so the two
 * places a location appears cannot drift into two different pins.
 */
export function PinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

"use client";

/**
 * SkipLink - Accessibility component for keyboard users (WCAG 2.4.1)
 *
 * Allows keyboard users to skip repetitive navigation and jump directly
 * to main content. Only visible when focused via keyboard navigation.
 */
interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string;
  /** Custom label for the skip link */
  label?: string;
}

export function SkipLink({
  targetId = "main-content",
  label = "Skip to main content"
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link"
    >
      {label}
    </a>
  );
}

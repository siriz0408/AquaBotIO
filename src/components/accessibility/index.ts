/**
 * Accessibility Components - WCAG 2.2 AA Compliance
 *
 * These components provide essential accessibility features:
 * - SkipLink: Allows keyboard users to bypass navigation (WCAG 2.4.1)
 * - ScreenReaderAnnouncer: Live regions for dynamic content (WCAG 4.1.3)
 */

export { SkipLink } from "./skip-link";
export {
  ScreenReaderAnnouncerProvider,
  useAnnounce
} from "./screen-reader-announcer";

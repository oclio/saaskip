import {
  Alert02Icon,
  ArrowDownLeft01Icon,
  ArrowDownRight01Icon,
  ArrowLeftBigIcon,
  ArrowRight01Icon,
  ArrowUpLeft01Icon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Facebook02Icon,
  GithubIcon,
  GoogleIcon,
  InformationCircleIcon,
  InstagramIcon,
  Linkedin02Icon,
  Loading03Icon,
  Logout01Icon,
  Menu01Icon,
  MinusSignIcon,
  Moon02Icon,
  MultiplicationSignCircleIcon,
  NewTwitterIcon,
  SquareIcon,
  Sun02Icon,
  ThreadsIcon,
  Tick02Icon,
  TiktokIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ComponentProps } from 'react';

/**
 * Central icon registry — every component imports from here instead of
 * referencing icon objects directly. Ensures the same icon is reused
 * across the app: one source of truth, no duplicate imports for the
 * same purpose. Swap or rename an icon in one place without touching
 * component code.
 */
export const ICONS = {
  alert: Alert02Icon, // sonner warning
  back: ArrowLeftBigIcon,
  cancel: Cancel01Icon,
  checkCircle: CheckmarkCircle02Icon, // sonner success
  chevronRight: ArrowRight01Icon,
  errorCircle: MultiplicationSignCircleIcon, // sonner error
  infoCircle: InformationCircleIcon, // sonner info
  loading: Loading03Icon, // sonner loading
  logout: Logout01Icon,
  menu: Menu01Icon,
  minus: MinusSignIcon, // input-otp separator
  screenBottomLeft: ArrowDownLeft01Icon, // screen-size dev tool
  screenBottomRight: ArrowDownRight01Icon,
  screenSquare: SquareIcon,
  screenTopLeft: ArrowUpLeft01Icon,
  screenTopRight: ArrowUpRight01Icon,
  socialFacebook: Facebook02Icon, // footer social links
  socialGithub: GithubIcon, // login provider
  socialGoogle: GoogleIcon, // login provider
  socialInstagram: InstagramIcon,
  socialLinkedin: Linkedin02Icon,
  socialThreads: ThreadsIcon,
  socialTiktok: TiktokIcon,
  socialTwitter: NewTwitterIcon,
  themeDark: Moon02Icon, // theme toggle
  themeLight: Sun02Icon,
  tick: Tick02Icon,
};

type IconName = keyof typeof ICONS;
type IconProps = Omit<ComponentProps<'svg'>, 'strokeWidth'> & {
  strokeWidth?: number;
};

/**
 * Render an icon by registry name. Accepts all standard SVG attributes
 * (className, aria-hidden, strokeWidth, size, etc.).
 *
 * To swap icon library, change only this function and the ICONS registry.
 * No component or test needs to change.
 */
export function icon(name: IconName, props?: IconProps) {
  return <HugeiconsIcon icon={ICONS[name]} {...props} />;
}

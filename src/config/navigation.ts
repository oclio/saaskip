import { ICONS } from '@/config/icons';

export interface NavigationItem {
  label: string; // i18n key resolved via t(label)
  href: string; // internal path or anchor (#section)
  location: ('navbar' | 'footer' | 'mobileMenu')[]; // where the link renders
  category?: string; // matches a NavigationCategory key for footer grouping
}

interface SocialLink {
  name: string; // platform name, used in aria-label
  icon: keyof typeof ICONS; // key into the ICONS registry
  href: string; // profile URL
}

export interface NavigationCategory {
  title: string; // i18n key for the footer column heading
  key: string; // referenced by NavigationItem.category
}

/**
Footer column headings — each groups navigation items by category.
*/
export const navigationCategories: NavigationCategory[] = [
  {
    key: 'product',
    title: 'components.footer.categories.product',
  },
  {
    key: 'help',
    title: 'components.footer.categories.help',
  },
  {
    key: 'company',
    title: 'components.footer.categories.company',
  },
  {
    key: 'legal',
    title: 'components.footer.categories.legal',
  },
];

/**
 * Navigation links — each item declares where it renders (navbar, footer,
 * mobile menu) and which footer category it belongs to. Labels are i18n
 * keys, not display text.
 */
export const navigation: NavigationItem[] = [
  {
    category: 'product',
    href: '/#features-section',
    label: 'pages.landing.features.title',
    location: ['footer', 'mobileMenu', 'navbar'],
  },
  {
    category: 'product',
    href: '/#pricing-section',
    label: 'pages.landing.pricing.title',
    location: ['footer', 'mobileMenu', 'navbar'],
  },
  {
    category: 'help',
    href: '/#faq-section',
    label: 'pages.faq.shortTitle',
    location: ['footer', 'mobileMenu', 'navbar'],
  },
  {
    category: 'product',
    href: '/#what-is-included-section',
    label: 'pages.whatIsIncluded.title',
    location: ['footer', 'mobileMenu', 'navbar'],
  },
  {
    category: 'product',
    href: '/#cta-section',
    label: 'pages.landing.cta.title',
    location: ['mobileMenu', 'navbar'],
  },
  {
    category: 'help',
    href: '#',
    label: 'pages.documentation.title',
    location: ['footer', 'mobileMenu'],
  },
  {
    category: 'help',
    href: '#',
    label: 'pages.help.shortTitle',
    location: ['footer'],
  },
  {
    category: 'help',
    href: '/contact',
    label: 'pages.contact.title',
    location: ['footer', 'mobileMenu'],
  },
  {
    category: 'company',
    href: '#',
    label: 'pages.about.title',
    location: ['footer'],
  },
  {
    category: 'company',
    href: '#',
    label: 'pages.blog.title',
    location: ['footer'],
  },
  {
    category: 'company',
    href: '#',
    label: 'pages.partners.title',
    location: ['footer'],
  },
  {
    category: 'company',
    href: '#',
    label: 'pages.press.title',
    location: ['footer'],
  },
  {
    category: 'legal',
    href: '/cookies',
    label: 'pages.cookies.shortTitle',
    location: ['footer'],
  },
  {
    category: 'legal',
    href: '/license',
    label: 'pages.license.title',
    location: ['footer'],
  },
  {
    category: 'legal',
    href: '/privacy',
    label: 'pages.privacy.shortTitle',
    location: ['footer'],
  },
  {
    category: 'legal',
    href: '/terms',
    label: 'pages.terms.shortTitle',
    location: ['footer'],
  },
];

/**
Social profile links rendered in the footer — icons come from the ICONS registry.
*/
export const socialLinks: SocialLink[] = [
  {
    href: '#',
    icon: 'socialFacebook',
    name: 'Facebook',
  },
  {
    href: '#',
    icon: 'socialInstagram',
    name: 'Instagram',
  },
  {
    href: '#',
    icon: 'socialLinkedin',
    name: 'Linkedin',
  },
  {
    href: '#',
    icon: 'socialThreads',
    name: 'Threads',
  },
  {
    href: '#',
    icon: 'socialTiktok',
    name: 'Tiktok',
  },
  {
    href: '#',
    icon: 'socialTwitter',
    name: 'X/Twitter',
  },
];

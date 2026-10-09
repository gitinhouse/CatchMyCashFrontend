import {
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from 'react-icons/fa6';

// The company's social and contact links, shared by the footer and the Contact
// page so the two cannot drift apart.
//
// Real icons rather than the lookalike characters that were used before: 𝕏,
// "in", ◉ and @ rendered at whatever each platform's font decided, and screen
// readers read them out as the symbols they are.
export const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/', Icon: FaXTwitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/feed/', Icon: FaLinkedinIn },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/accounts/log_in/',
    Icon: FaInstagram,
  },
  // The symbol here used to link to Google's Gmail product page, which is not
  // anybody's inbox; an envelope should open a message to support.
  { label: 'Email', href: 'mailto:help@catchmycash.com', Icon: FaEnvelope },
];

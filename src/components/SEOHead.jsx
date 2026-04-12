/* SEO Head component — Dynamic meta tag injection */
import { useEffect } from 'react';

export default function SEOHead({ title, description, keywords, ogImage, ogType = 'website', canonical }) {
  useEffect(() => {
    const baseTitle = 'Wish Studio';
    document.title = title ? `${title} | ${baseTitle}` : `${baseTitle} — Nepal's Premium Greeting Template Creator`;

    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('og:title', title || baseTitle);
    setMeta('og:description', description);
    if (ogImage) setMeta('og:image', ogImage);
    setMeta('og:type', ogType);
    setMeta('twitter:title', title || baseTitle);
    setMeta('twitter:description', description);
    if (ogImage) setMeta('twitter:image', ogImage);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null;
}

/* Static info pages */
import React from 'react';
import SEOHead from '../components/SEOHead';

export function About() {
  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 680 }}>
      <SEOHead title="About" description="About Wish Studio — Nepal's premium greeting template creator." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>About Wish Studio</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p>Wish Studio is Nepal's premium greeting template creator — designed to help you create beautiful, personalized wishes for every occasion. Whether it's Dashain, Tihar, birthdays, or everyday greetings, we have you covered.</p>
        <p>Our mission is to make it easy for everyone — no design skills needed — to express love, joy, and celebration through stunning digital wish cards.</p>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: 'var(--text-xl)', marginTop: 'var(--space-2)' }}>Features</h2>
        <ul style={{ paddingLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'disc' }}>
          <li>Browse 100+ wish templates for 30+ occasions</li>
          <li>Customize with text, fonts, stickers, and effects</li>
          <li>Export as high-quality images or animated GIFs</li>
          <li>Upload your own photos and turn them into wishes</li>
          <li>Share directly to WhatsApp, Facebook, and more</li>
        </ul>
        <p>Made with ❤️ in Nepal. 🇳🇵</p>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 680 }}>
      <SEOHead title="Contact" description="Get in touch with Wish Studio team." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Contact Us</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Have questions or feedback? We'd love to hear from you.</p>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="input-group"><label className="input-label">Name</label><input className="input" placeholder="Your name" /></div>
        <div className="input-group"><label className="input-label">Email</label><input type="email" className="input" placeholder="you@example.com" /></div>
        <div className="input-group"><label className="input-label">Message</label><textarea className="input textarea" placeholder="Your message..." rows={5} /></div>
        <button className="btn btn-primary btn-lg" type="submit" style={{ alignSelf: 'flex-start' }}>Send Message</button>
      </form>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 680 }}>
      <SEOHead title="Privacy Policy" description="Wish Studio privacy policy." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Privacy Policy</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p>Your privacy is important to us. Wish Studio collects only the minimum data needed to provide our services.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Data We Collect</h3>
        <p>We collect email addresses when you create an account. Template browsing data is collected anonymously for analytics purposes. Images you upload are stored securely and are only accessible to you.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>How We Use Data</h3>
        <p>Data is used to provide and improve our services. We never sell your personal information to third parties.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Contact</h3>
        <p>For privacy concerns, contact us at privacy@wishstudio.com</p>
      </div>
    </div>
  );
}

export function Terms() {
  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 680 }}>
      <SEOHead title="Terms of Service" description="Wish Studio terms of service." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Terms of Service</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p>By using Wish Studio, you agree to the following terms.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Use of Service</h3>
        <p>Wish Studio is provided free for personal use. Commercial redistribution of templates requires permission.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>User Content</h3>
        <p>You retain ownership of any content you create or upload. By uploading, you grant us a license to store and serve your content for the purpose of providing the service.</p>
        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Disclaimer</h3>
        <p>Templates are provided "as is" without warranty. We are not liable for any issues arising from use of the service.</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const faqs = [
    { q: 'Is Wish Studio free?', a: 'Yes! Most templates are free to use. Some premium templates may require a subscription in the future.' },
    { q: 'Can I upload my own images?', a: 'Absolutely! Upload any image and customize it with our editor — add text, stickers, effects, and more.' },
    { q: 'How do I download my creation?', a: 'After editing, click the Export button to download as PNG (high quality image) or GIF (animated).' },
    { q: 'What occasions are supported?', a: 'We support 30+ occasions including Dashain, Tihar, Holi, birthdays, weddings, love, good morning/night wishes, and more.' },
    { q: 'Can I share to WhatsApp?', a: 'Yes! Download your creation and share it directly through WhatsApp, Facebook, or any app.' },
    { q: 'Do I need an account?', a: 'You can browse and use the editor without an account. Sign up to save favorites and drafts.' },
  ];

  return (
    <div className="container page-enter" style={{ paddingTop: 'var(--space-6)', maxWidth: 680 }}>
      <SEOHead title="FAQ" description="Frequently asked questions about Wish Studio." />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)' }}>Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {faqs.map(({ q, a }, i) => (
          <details key={i} className="card-flat" style={{ padding: 'var(--space-4)' }}>
            <summary style={{ fontWeight: 'var(--font-semibold)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>{q}</summary>
            <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

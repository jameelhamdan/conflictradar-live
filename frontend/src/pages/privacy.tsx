const LAST_UPDATED = '2026-03-06'

const SECTION = {
  borderTop: '1px solid #1a1a26',
  paddingTop: '2rem',
  marginBottom: '2.5rem',
} as const

const H2 = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: '#c8c8d8',
  marginBottom: '0.9rem',
  letterSpacing: '-0.01em',
} as const

const P = {
  color: '#888899',
  lineHeight: 1.75 as const,
  fontSize: '0.92rem',
  marginBottom: '0.75rem',
} as const

const UL = {
  color: '#888899',
  lineHeight: 1.75 as const,
  fontSize: '0.92rem',
  paddingLeft: '1.25rem',
  marginBottom: '0.75rem',
} as const

import SiteHeader from '../components/SiteHeader'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#e0e0e0' }}>
      <title>Privacy Policy — conflictradar.live</title>
      <meta name="description" content="Privacy Policy and Cookie Policy for conflictradar.live." />
      <link rel="canonical" href="https://conflictradar.live/privacy" />

      <SiteHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#e8e8f0', marginBottom: '0.5rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#44445a', fontSize: '0.82rem' }}>Last updated: {LAST_UPDATED}</p>
        </header>

        <section style={SECTION}>
          <h2 style={H2}>1. Who we are</h2>
          <p style={P}>
            conflictradar.live is an independent open-source project that provides a real-time map of
            global events sourced from publicly available news feeds. We do not operate as a legal entity
            and do not sell products or services. For questions, contact{' '}
            <a href="mailto:contact@conflictradar.live" style={{ color: '#7c9ef8' }}>contact@conflictradar.live</a>.
          </p>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>2. What data we collect</h2>
          <p style={P}>We collect as little data as possible. Here is what our infrastructure processes:</p>
          <ul style={UL}>
            <li><strong style={{ color: '#c8c8d8' }}>Server access logs</strong> — your IP address, browser User-Agent, and requested URL are logged by our web server. These logs are used solely for security monitoring and are retained for a maximum of 30 days before automatic deletion.</li>
            <li><strong style={{ color: '#c8c8d8' }}>Analytics cookies (optional)</strong> — if you accept analytics, Google Analytics 4 is loaded. This sets cookies that allow Google to measure traffic, page views, and aggregate usage patterns. See Section 4 for details.</li>
          </ul>
          <p style={P}>
            We do not operate user accounts, collect names, email addresses, or any other directly
            identifying personal data through the website itself.
          </p>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>3. Legal basis (GDPR)</h2>
          <ul style={UL}>
            <li><strong style={{ color: '#c8c8d8' }}>Server logs</strong> — processed under <em>Legitimate Interest</em> (Art. 6(1)(f) GDPR) for security and abuse prevention. Retained for 30 days.</li>
            <li><strong style={{ color: '#c8c8d8' }}>Analytics cookies</strong> — processed under your explicit <em>Consent</em> (Art. 6(1)(a) GDPR). Analytics only load after you click "Accept analytics" in the cookie banner. You can withdraw consent at any time (see Section 6).</li>
          </ul>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>4. Cookies</h2>
          <p style={P}>
            We use <strong style={{ color: '#c8c8d8' }}>one category of cookies</strong>:
          </p>
          <ul style={UL}>
            <li>
              <strong style={{ color: '#c8c8d8' }}>Analytics cookies (Google Analytics 4)</strong> — only set if you accept.
              GA4 sets cookies including <code style={{ color: '#7c9ef8', fontSize: '0.85rem' }}>_ga</code>,{' '}
              <code style={{ color: '#7c9ef8', fontSize: '0.85rem' }}>_ga_*</code> with a 2-year lifetime.
              These are used to distinguish users and sessions and to measure aggregate site usage.
              Google processes this data under their own{' '}
              <a href="https://policies.google.com/privacy" style={{ color: '#7c9ef8' }} target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
              No advertising or remarketing features are enabled.
            </li>
          </ul>
          <p style={P}>
            We do not use any essential, functional, or preference cookies. The site works identically
            with or without analytics cookies accepted.
          </p>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>5. Third-party data processors</h2>
          <ul style={UL}>
            <li><strong style={{ color: '#c8c8d8' }}>Google LLC (Analytics)</strong> — analytics data, if consented, is processed by Google in the United States under the EU–US Data Privacy Framework. See <a href="https://policies.google.com/privacy" style={{ color: '#7c9ef8' }} target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.</li>
            <li><strong style={{ color: '#c8c8d8' }}>Hosting provider</strong> — our server infrastructure provider processes server logs as a data processor under a Data Processing Agreement.</li>
          </ul>
          <p style={P}>We do not sell, rent, or share personal data with any other third parties.</p>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>6. Your rights and cookie withdrawal</h2>
          <p style={P}>Under GDPR you have the right to:</p>
          <ul style={UL}>
            <li>Access, rectify, or erase personal data we hold about you</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
            <li>Lodge a complaint with your national supervisory authority</li>
          </ul>
          <p style={P}>
            <strong style={{ color: '#c8c8d8' }}>To withdraw analytics consent</strong>, open your browser's
            developer tools, go to Application → Local Storage → conflictradar.live, and delete the{' '}
            <code style={{ color: '#7c9ef8', fontSize: '0.85rem' }}>cr_cookie_consent</code> key. Then reload
            the page and choose "Decline" in the cookie banner. You can also clear all cookies for this site
            in your browser settings.
          </p>
          <p style={P}>
            For any data requests, contact us at{' '}
            <a href="mailto:contact@conflictradar.live" style={{ color: '#7c9ef8' }}>contact@conflictradar.live</a>.
            We aim to respond within 30 days.
          </p>
        </section>

        <section style={SECTION}>
          <h2 style={H2}>7. Data retention</h2>
          <ul style={UL}>
            <li>Server access logs: 30 days</li>
            <li>GA4 analytics data: 14 months (Google's default retention setting)</li>
          </ul>
        </section>

        <section style={{ ...SECTION, marginBottom: 0 }}>
          <h2 style={H2}>8. Changes to this policy</h2>
          <p style={{ ...P, marginBottom: 0 }}>
            We may update this policy when our practices change. The "Last updated" date at the top of
            this page reflects the most recent revision. Continued use of the site after a change
            constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>

      <footer style={{
        borderTop: '1px solid #1a1a26',
        padding: '1.25rem 2rem',
        display: 'flex', gap: '1.25rem', flexWrap: 'wrap',
        fontSize: '0.78rem', color: '#44445a',
      }}>
        <a href="/terms" style={{ color: '#44445a', textDecoration: 'none' }}>Terms of Service</a>
        <a href="/privacy" style={{ color: '#7c9ef8', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/about" style={{ color: '#44445a', textDecoration: 'none' }}>About</a>
      </footer>
    </div>
  )
}

export const getConfig = async () => ({ render: 'static' as const })

export default function SiteHeader({ activePage }: { activePage?: string }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0 1rem',
        height: 44,
        background: '#13131c',
        borderBottom: '1px solid #1e1e2a',
        flexShrink: 0,
      }}
    >
      <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em', color: '#e8e8f0' }}>
          conflictradar
        </span>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em', color: '#e05252' }}>
          .live
        </span>
      </a>
      <div style={{ flex: 1 }} />
      <a
        href="/about"
        style={{
          color: activePage === 'about' ? '#e8e8f0' : '#55556a',
          fontSize: '0.8rem',
          fontWeight: 500,
          textDecoration: 'none',
          padding: '0.2rem 0.45rem',
          borderRadius: 4,
        }}
      >
        About
      </a>
      <a
        href="/newsletter"
        style={{
          color: activePage === 'newsletter' ? '#e8e8f0' : '#55556a',
          fontSize: '0.8rem',
          fontWeight: 500,
          textDecoration: 'none',
          padding: '0.2rem 0.45rem',
          borderRadius: 4,
        }}
      >
        Newsletter
      </a>
    </nav>
  )
}

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#1a1a1a', color: '#fff' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404 - Not Found</h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>The page you are looking for does not exist or the conference name is invalid.</p>
      <a href="/" style={{ color: '#61dafb', textDecoration: 'underline', fontSize: '1.1rem' }}>Go back home</a>
    </div>
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BarChart3,
  Clipboard,
  Copy,
  ExternalLink,
  Gauge,
  Link2,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import './styles.css';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace(/\/$/, '');

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.status === 'fail') {
    const message = payload?.message || 'Something went wrong';
    const error = new Error(message);
    error.statusCode = response.status;
    error.errors = payload?.errors || [];
    throw error;
  }

  return payload?.data || {};
}

const emptyAuth = { email: '', password: '', firstName: '', lastName: '' };

function App() {
  const [view, setView] = React.useState('home');
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [authForm, setAuthForm] = React.useState(emptyAuth);
  const [authMode, setAuthMode] = React.useState('login');
  const [authError, setAuthError] = React.useState('');
  const [authLoading, setAuthLoading] = React.useState(false);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [urlForm, setUrlForm] = React.useState({ url: '', code: '' });
  const [urls, setUrls] = React.useState([]);
  const [urlError, setUrlError] = React.useState('');
  const [urlSuccess, setUrlSuccess] = React.useState('');
  const [urlLoading, setUrlLoading] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    refreshCodes({ quiet: true }).finally(() => setCheckingSession(false));
  }, []);

  async function refreshCodes({ quiet = false } = {}) {
    try {
      const data = await apiRequest('/url/codes', { method: 'POST', body: '{}' });
      setUrls(data.codes || []);
      setIsAuthed(true);
      if (!quiet) setUrlError('');
    } catch (error) {
      setIsAuthed(false);
      setUrls([]);
      if (!quiet && error.statusCode !== 401) setUrlError(formatError(error));
    }
  }

  function showAuth(mode) {
    setAuthMode(mode);
    setView('auth');
    setAuthError('');
    setMenuOpen(false);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const path = authMode === 'signup' ? '/user/signup' : '/user/login';
    const body =
      authMode === 'signup'
        ? authForm
        : { email: authForm.email, password: authForm.password };

    try {
      await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
      if (authMode === 'signup') {
        await apiRequest('/user/login', {
          method: 'POST',
          body: JSON.stringify({ email: authForm.email, password: authForm.password }),
        });
      }
      setAuthForm(emptyAuth);
      setIsAuthed(true);
      setView('dashboard');
      await refreshCodes({ quiet: true });
    } catch (error) {
      setAuthError(formatError(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitShorten(event) {
    event.preventDefault();
    setUrlLoading(true);
    setUrlError('');
    setUrlSuccess('');

    const body = {
      url: urlForm.url.trim(),
      ...(urlForm.code.trim() ? { code: urlForm.code.trim() } : {}),
    };

    try {
      const data = await apiRequest('/url/shorten', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setUrlForm({ url: '', code: '' });
      setUrlSuccess(`Created ${shortUrl(data.shortCode)}`);
      await refreshCodes({ quiet: true });
    } catch (error) {
      setUrlError(formatError(error));
      if (error.statusCode === 401) showAuth('login');
    } finally {
      setUrlLoading(false);
    }
  }

  async function deleteUrl(id) {
    setUrlError('');
    setUrlSuccess('');
    try {
      await apiRequest(`/url/${id}`, { method: 'DELETE' });
      setUrls((current) => current.filter((item) => item.id !== id));
      setUrlSuccess('Link removed');
    } catch (error) {
      setUrlError(formatError(error));
    }
  }

  async function copyLink(code) {
    await navigator.clipboard.writeText(shortUrl(code));
    setUrlSuccess('Copied to clipboard');
  }

  function signOut() {
    setIsAuthed(false);
    setUrls([]);
    setView('home');
  }

  const navProps = {
    view,
    isAuthed,
    menuOpen,
    setMenuOpen,
    setView,
    showAuth,
    signOut,
  };

  return (
    <>
      <Header {...navProps} />
      {view === 'home' && (
        <Landing
          onShorten={(url) => {
            setUrlForm({ url, code: '' });
            if (isAuthed) setView('dashboard');
            else showAuth('login');
          }}
          showAuth={showAuth}
        />
      )}
      {view === 'auth' && (
        <AuthPage
          mode={authMode}
          setMode={setAuthMode}
          form={authForm}
          setForm={setAuthForm}
          onSubmit={submitAuth}
          error={authError}
          loading={authLoading}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          checkingSession={checkingSession}
          isAuthed={isAuthed}
          showAuth={showAuth}
          form={urlForm}
          setForm={setUrlForm}
          onSubmit={submitShorten}
          urls={urls}
          loading={urlLoading}
          error={urlError}
          success={urlSuccess}
          copyLink={copyLink}
          deleteUrl={deleteUrl}
        />
      )}
      {view !== 'dashboard' && <Footer />}
    </>
  );
}

function Header({ view, isAuthed, menuOpen, setMenuOpen, setView, showAuth, signOut }) {
  const goHome = () => {
    setView('home');
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <button className="brand text-button" onClick={goHome}>SHORT.LY</button>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <button onClick={goHome}>Features</button>
        <button onClick={goHome}>Pricing</button>
        <button onClick={goHome}>Blog</button>
        <button onClick={goHome}>About</button>
      </nav>
      <button className="seal text-button" onClick={goHome}>S.</button>
      <div className="header-actions">
        {isAuthed ? (
          <>
            <button className={view === 'dashboard' ? 'active-link' : ''} onClick={() => setView('dashboard')}>
              Dashboard
            </button>
            <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={signOut}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => showAuth('login')}>Log in</button>
            <button className="dark-button" onClick={() => showAuth('signup')}>Get started</button>
          </>
        )}
        <button className="icon-button" aria-label="Search" title="Search">
          <Search size={22} />
        </button>
        <button
          className="menu-button"
          aria-label="Toggle menu"
          title="Toggle menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function Landing({ onShorten, showAuth }) {
  const [heroUrl, setHeroUrl] = React.useState('');

  function submitHero(event) {
    event.preventDefault();
    onShorten(heroUrl);
  }

  return (
    <main>
      <section className="tag-strip">
        <span>Premium URL shortening</span>
        <span>Clean links. Stronger brand.</span>
        <span>Analytics & branding</span>
      </section>

      <section className="hero">
        <div className="ink-wash" />
        <div className="hero-copy">
          <h1>Short by design.</h1>
          <p>Transform long URLs into clean, branded links that build trust and drive results.</p>
        </div>
        <div className="hero-image" aria-hidden="true" />
        <form className="hero-form" onSubmit={submitHero}>
          <input
            value={heroUrl}
            onChange={(event) => setHeroUrl(event.target.value)}
            placeholder="Paste your long URL here..."
            aria-label="Long URL"
          />
          <button className="dark-button" type="submit">Shorten link</button>
        </form>
        <div className="sample-link">
          <strong>short.ly/style</strong>
          <Copy size={14} />
          <span>Copy link</span>
        </div>
        <div className="pen-art" aria-hidden="true" />
      </section>

      <section className="feature-row">
        <Feature icon={<Link2 />} title="Branded Links" text="Create custom short links that reflect your brand and build credibility." />
        <Feature icon={<BarChart3 />} title="Track Everything" text="Real-time analytics on clicks, locations, devices, and more." />
        <Feature icon={<ShieldCheck />} title="Secure & Reliable" text="Enterprise-grade routing with a clean, trusted experience." />
        <Feature icon={<Wand2 />} title="Tailored for You" text="Powerful tools for creators, marketers, and growing businesses." />
      </section>

      <section className="analytics-band">
        <div className="library-photo">
          <div className="metric-card">
            <span>deep insight.</span>
            <span>clear direction.</span>
            <div className="chart-line" />
            <small>Clicks</small>
            <strong>28,410</strong>
            <em>+34.7%</em>
          </div>
        </div>
        <div className="analytics-copy">
          <small>Analytics that empower</small>
          <h2>Understand your audience. Elevate your impact.</h2>
          <p>From click-through data to geographic trends, our analytics give you the insights you need to grow with confidence.</p>
          <button className="arrow-link" onClick={() => showAuth('signup')}>
            Explore analytics <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="creator-grid">
        <div className="creator-copy">
          <h2>Built for creators & brands that lead.</h2>
          <p>Whether you are sharing content, building a campaign, or growing your community, SHORT.LY gives you the tools to do it better.</p>
        </div>
        <div className="desk-photo" />
        <div className="capability-list">
          {['Custom domains', 'Deep linking tools', 'Link analytics', 'Team collaboration', 'API & integrations'].map((item) => (
            <button key={item}>
              {item}
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function AuthPage({ mode, setMode, form, setForm, onSubmit, error, loading }) {
  const isSignup = mode === 'signup';

  return (
    <main className="auth-page">
      <section className="auth-art">
        <small>{isSignup ? 'Begin with a clean mark' : 'Welcome back'}</small>
        <h1>{isSignup ? 'Build memorable links with a quieter kind of power.' : 'Return to your command desk.'}</h1>
        <p>Keep every short link polished, trackable, and ready to share.</p>
      </section>
      <section className="auth-panel">
        <div className="mode-tabs">
          <button className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>Log in</button>
          <button className={mode === 'signup' ? 'selected' : ''} onClick={() => setMode('signup')}>Sign up</button>
        </div>
        <form onSubmit={onSubmit} className="stack-form">
          {isSignup && (
            <div className="two-fields">
              <label>
                First name
                <input
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                />
              </label>
            </div>
          )}
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={8}
              maxLength={12}
              required
            />
          </label>
          <p className="hint">8-12 chars with uppercase, lowercase, number, and special character.</p>
          {error && <div className="form-error">{error}</div>}
          <button className="dark-button wide-button" disabled={loading}>
            {loading ? 'Working...' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({
  checkingSession,
  isAuthed,
  showAuth,
  form,
  setForm,
  onSubmit,
  urls,
  loading,
  error,
  success,
  copyLink,
  deleteUrl,
}) {
  if (checkingSession) {
    return <main className="dashboard-shell"><div className="empty-state">Checking your session...</div></main>;
  }

  if (!isAuthed) {
    return (
      <main className="dashboard-shell">
        <section className="empty-state">
          <h1>Log in to manage links.</h1>
          <p>Your shortened links, custom codes, and analytics tools live here.</p>
          <button className="dark-button" onClick={() => showAuth('login')}>Log in</button>
        </section>
      </main>
    );
  }

  const totalClicks = urls.length * 137 + 410;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <small>SHORT.LY workspace</small>
          <h1>Design, shorten, and manage every link.</h1>
        </div>
        <div className="dashboard-stats">
          <Stat icon={<Link2 />} label="Active links" value={urls.length} />
          <Stat icon={<Gauge />} label="Est. clicks" value={totalClicks.toLocaleString()} />
          <Stat icon={<Sparkles />} label="Custom codes" value={urls.filter((item) => item.shortCode?.length !== 8).length} />
        </div>
      </section>

      <section className="workbench">
        <form className="shorten-panel" onSubmit={onSubmit}>
          <div>
            <small>Create a link</small>
            <h2>Shorten with intent.</h2>
          </div>
          <label>
            Destination URL
            <input
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://example.com/very/long/link"
              required
            />
          </label>
          <label>
            Custom code
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="campaign-name"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button className="dark-button wide-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create short link'}
          </button>
        </form>

        <section className="link-table">
          <div className="table-head">
            <div>
              <small>Library</small>
              <h2>Your links</h2>
            </div>
            <span>{urls.length} total</span>
          </div>
          {urls.length === 0 ? (
            <div className="table-empty">No links yet. Create the first one from the panel.</div>
          ) : (
            <div className="rows">
              {urls.map((item) => (
                <article className="link-row" key={item.id}>
                  <div>
                    <strong>{shortUrl(item.shortCode)}</strong>
                    <span>{item.targetURL}</span>
                  </div>
                  <div className="row-actions">
                    <button className="icon-button" aria-label="Copy link" title="Copy link" onClick={() => copyLink(item.shortCode)}>
                      <Clipboard size={17} />
                    </button>
                    <a className="icon-button" aria-label="Open link" title="Open link" href={shortUrl(item.shortCode)} target="_blank" rel="noreferrer">
                      <ExternalLink size={17} />
                    </a>
                    <button className="icon-button danger" aria-label="Delete link" title="Delete link" onClick={() => deleteUrl(item.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }) {
  return (
    <article className="stat-card">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>SHORT.LY</strong>
        <span>© 2026 SHORT.LY. All rights reserved.</span>
      </div>
      <span className="footer-seal">S.</span>
      <nav>
        <button>About</button>
        <button>Careers</button>
        <button>Support</button>
        <button>Contact</button>
      </nav>
    </footer>
  );
}

function formatError(error) {
  if (error.errors?.length) {
    return error.errors.map((item) => item.message).join(' ');
  }
  return error.message || 'Something went wrong';
}

function shortUrl(code) {
  return `${API_BASE}/url/${code}`;
}

createRoot(document.getElementById('root')).render(<App />);

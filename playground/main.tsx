import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import { TradingChart, type ChartThemeInput } from "../src";
import "../src/styles.css";
import "./playground.css";
import { CodeBlock } from "./CodeBlock";
import { Docs } from "./Docs";
import { Studio } from "./Studio";
import { marketData } from "./data";

const heroTheme: ChartThemeInput = {
  backgroundStyle: { type: "gradient", color: "#080b14", colorTo: "#101b31", angle: 140, texture: "dots", textureOpacity: 0.035 },
  candlestick: { bullishBody: "#2de0ae", bearishBody: "#ff607d", bullishWick: "#65eac5", bearishWick: "#ff89a0", bodyRadius: 1.5 },
  gridStyle: { horizontal: { color: "rgba(148, 163, 184, .08)" }, vertical: { color: "rgba(148, 163, 184, .05)" } },
  accent: "#8b7cff",
};

const integrationCode = `import { TradingChart } from "ohlcraft";
import "ohlcraft/styles.css";

export function Markets({ candles }) {
  return (
    <TradingChart
      data={candles}
      height={560}
      defaultTimeframe="1h"
      theme="dark"
      showVolume
    />
  );
}`;

function App() {
  const data = useMemo(() => marketData(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [installCopied, setInstallCopied] = useState(false);

  const copyInstall = async () => {
    try { await navigator.clipboard.writeText("npm install ohlcraft"); }
    catch { return; }
    setInstallCopied(true);
    window.setTimeout(() => setInstallCopied(false), 1500);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-page">
      <div className="release-bar"><span><i />Version 0.1 is ready</span><a href="#docs">Read the release guide <b>→</b></a></div>
      <nav className="site-nav" aria-label="Main navigation">
        <a className="site-brand" href="#top" onClick={closeMenu}><span className="brand-mark"><i /><i /><i /></span><span>OHLC<span>raft</span></span></a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#studio" onClick={closeMenu}>Studio</a>
          <a href="#docs" onClick={closeMenu}>Documentation</a>
          <a href="#performance" onClick={closeMenu}>Performance</a>
        </div>
        <div className="nav-actions">
          <a className="nav-text-link" href="#docs">API reference</a>
          <a className="button button-small button-primary" href="#studio">Open Studio <span>↗</span></a>
          <button type="button" className={`mobile-menu ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}><i /><i /><i /></button>
        </div>
      </nav>

      <main id="top">
        <section className="hero site-section">
          <div className="hero-copy">
            <div className="hero-badge"><span>Canvas-native</span><i />React 18 & 19<i />Next.js ready</div>
            <h1>Craft the financial chart your product <em>deserves.</em></h1>
            <p>OHLCraft is a fast, deeply customizable trading chart for React and Next.js. Professional interactions, technical analysis, and a typed API—without a heavyweight runtime.</p>
            <div className="hero-actions"><a className="button button-primary" href="#studio">Design your chart <span>→</span></a><a className="button button-secondary" href="#docs">View documentation</a></div>
            <button type="button" className="install-command" onClick={copyInstall}><span><b>$</b> npm install ohlcraft</span><em>{installCopied ? "Copied ✓" : "Copy"}</em></button>
            <div className="hero-meta"><span><b>0</b> runtime dependencies</span><span><b>7</b> chart types</span><span><b>11</b> drawing tools</span></div>
          </div>

          <div className="hero-visual">
            <div className="hero-window">
              <div className="window-top"><div><span className="window-dots"><i /><i /><i /></span><strong>BTC / USD</strong><small>Bitcoin</small></div><div><span>1H</span><span>Indicators</span><b>Live</b></div></div>
              <TradingChart data={data} height={455} theme={heroTheme} defaultTimeframe="1h" showToolbar={false} showDrawingHistoryControls={false} showWatermark={false} indicators={[{ type: "ema", period: 21, color: "#f5b942", lineWidth: 1.5 }]} priceScaleWidth={72} initialBarSpacing={7} />
              <div className="hero-price-card"><span>BTC / USD</span><strong>$68,428.30</strong><em>+2.84%</em></div>
              <div className="hero-signal"><i />Realtime canvas rendering</div>
            </div>
          </div>
        </section>

        <section className="trust-row site-section" aria-label="Compatibility"><span>Built for the modern frontend stack</span><div><strong>React</strong><strong>Next.js</strong><strong>TypeScript</strong><strong>Canvas 2D</strong><strong>SSR safe</strong></div></section>

        <section className="features site-section" id="product">
          <div className="section-heading"><div><span className="section-kicker">A complete charting surface</span><h2>Serious charting.<br />Thoughtful developer experience.</h2></div><p>Everything your users expect from a financial chart, exposed through a compact component that feels at home in your codebase.</p></div>
          <div className="bento-grid">
            <article className="feature-card feature-large"><div className="feature-number">01</div><div className="mini-candles" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ height: 18 + ((index * 17) % 42), marginTop: (index * 11) % 28 }} />)}</div><div><span className="feature-tag">Rendering</span><h3>Canvas speed, even when the market moves fast.</h3><p>Viewport-only rendering, capped HiDPI scaling, and memoized indicators keep interactions fluid across thousands of candles.</p></div></article>
            <article className="feature-card"><div className="feature-number">02</div><div className="feature-icon icon-tools"><i /><i /><i /></div><span className="feature-tag">Analysis</span><h3>11 professional drawing tools</h3><p>Trend lines, rays, Fibonacci, measurements, long/short positions, and in-chart style controls.</p></article>
            <article className="feature-card"><div className="feature-number">03</div><div className="feature-icon icon-theme"><i /><i /><i /></div><span className="feature-tag">Design system</span><h3>Deep visual control</h3><p>Style candles, grids, axes, crosshair, volume, typography, textures, and backgrounds independently.</p></article>
            <article className="feature-card"><div className="feature-number">04</div><div className="feature-icon icon-types"><span>TS</span></div><span className="feature-tag">Confidence</span><h3>Typed from data to events</h3><p>First-class TypeScript types for themes, drawings, indicators, locales, callbacks, and imperative actions.</p></article>
            <article className="feature-card feature-wide"><div><div className="feature-number">05</div><span className="feature-tag">Interaction</span><h3>Built to feel familiar from the first drag.</h3><p>Anchored wheel zoom, time and price-scale gestures, magnetic snapping, realtime navigation, responsive crosshair, and keyboard control.</p></div><div className="interaction-demo"><span className="cross-v" /><span className="cross-h" /><i className="cross-point" /><div><small>APR 18, 14:00</small><strong>$68,402.18</strong></div></div></article>
          </div>
        </section>

        <section className="developer-section site-section" id="performance">
          <div className="developer-copy"><span className="section-kicker">Made for implementation</span><h2>One component.<br />A production-grade result.</h2><p>Import the chart, pass your data, and grow into the advanced API only when you need it. The package is SSR-safe and includes a client boundary for Next.js App Router.</p><ul><li><i>✓</i><span><strong>React 18 and 19</strong> as peer dependencies</span></li><li><i>✓</i><span><strong>No runtime dependency</strong> beyond React</span></li><li><i>✓</i><span><strong>Controlled or uncontrolled</strong> drawing state</span></li><li><i>✓</i><span><strong>Export-ready</strong> PNG and JPEG images</span></li></ul><a href="#docs" className="text-arrow">Explore the API <span>→</span></a></div>
          <div className="developer-code"><div className="code-glow" /><CodeBlock code={integrationCode} title="market-chart.tsx" /></div>
        </section>

        <Studio data={data} />
        <Docs />

        <section className="final-cta site-section"><div><span className="section-kicker">Ship the chart you wanted</span><h2>From first candle to production.</h2><p>Design it in OHLCraft Studio, copy the generated component, and make it part of your product.</p></div><div><a className="button button-light" href="#studio">Open OHLCraft Studio <span>→</span></a><button type="button" className="install-command install-light" onClick={copyInstall}><span>npm i ohlcraft</span><em>{installCopied ? "Copied ✓" : "Copy"}</em></button></div></section>
      </main>

      <footer className="site-footer site-section">
        <div className="footer-brand"><a className="site-brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>OHLC<span>raft</span></span></a><p>Craft financial charts your way with React, Next.js, and Canvas.</p></div>
        <div className="footer-links"><div><strong>Product</strong><a href="#product">Features</a><a href="#studio">Theme Studio</a><a href="#performance">Performance</a></div><div><strong>Developers</strong><a href="#docs">Documentation</a><a href="#docs-props">API reference</a><a href="#docs-theme">Theming</a></div><div><strong>Project</strong><a href="#top">Changelog</a><a href="#docs">License</a><a href="#top">npm package</a></div></div>
        <div className="footer-bottom"><span>© 2026 OHLCraft. MIT licensed.</span><span>Craft financial charts your way.</span></div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

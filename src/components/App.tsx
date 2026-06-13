import { useState } from "react";

const views = [
  {
    id: "overview",
    label: "Overview",
    title: "Sales overview",
    description: "Pipeline, account, and case signals will appear here.",
  },
  {
    id: "accounts",
    label: "Accounts",
    title: "Accounts",
    description: "Shared customer records, contacts, activity, deals, and cases.",
  },
  {
    id: "deals",
    label: "Deals",
    title: "Deal pipeline",
    description: "Direct and reseller opportunities with time-phased forecasts.",
  },
  {
    id: "cases",
    label: "Cases",
    title: "Cases",
    description: "Service issues, ownership, priority, status, and threaded notes.",
  },
] as const;

type ViewId = (typeof views)[number]["id"];

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("overview");
  const view = views.find((item) => item.id === activeView) ?? views[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="HMD Secure CRM home">
          <span className="brand-mark">H</span>
          <span>
            <strong>HMD Secure</strong>
            <small>CRM workspace</small>
          </span>
        </a>

        <nav aria-label="Primary navigation">
          {views.map((item) => (
            <button
              className={activeView === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="profile">
          <span className="avatar">SR</span>
          <span>
            <strong>Sales Rep</strong>
            <small>Demo workspace</small>
          </span>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Starter workspace</p>
            <h1>{view.title}</h1>
            <p>{view.description}</p>
          </div>
          <button className="primary-action" type="button">
            Create record
          </button>
        </header>

        <section className="empty-state" aria-labelledby="empty-state-title">
          <span className="status-dot" aria-hidden="true" />
          <p className="eyebrow">Scaffold ready</p>
          <h2 id="empty-state-title">Build the first workflow here.</h2>
          <p>
            Astro, React, strict TypeScript, Bun, and the production Docker
            runtime are connected. No application data model has been assumed.
          </p>
        </section>
      </main>
    </div>
  );
}

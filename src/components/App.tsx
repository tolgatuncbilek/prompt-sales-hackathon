import { useMemo, useState } from "react";

type Deal = {
  id: string;
  account: string;
  region: string;
  channel: "Direct" | "Reseller";
  stage: string;
  owner: string;
  closeDate: string;
  nextQuarter: string;
  deviceRevenue: string;
  serviceRevenue: string;
  total: string;
  risk: "At risk" | "On track" | "Overdue" | "Early";
  riskDetail: string;
  suggestion: string;
  evidence: string[];
  confidence: string;
};

const deals: Deal[] = [
  {
    id: "nordcom",
    account: "Nordcom Mobility",
    region: "DACH",
    channel: "Direct",
    stage: "Customer test",
    owner: "Aino Lahti",
    closeDate: "18 Jul 2026",
    nextQuarter: "EUR 184k",
    deviceRevenue: "EUR 980k",
    serviceRevenue: "EUR 264k",
    total: "EUR 1.24m",
    risk: "At risk",
    riskDetail: "No activity for 18 days",
    suggestion: "Confirm pilot acceptance criteria and book the technical review before Friday.",
    evidence: [
      "Customer test began 21 May; no outcome has been recorded.",
      "Last meeting note asks for battery-policy confirmation.",
      "Expected close is 35 days away.",
    ],
    confidence: "High confidence",
  },
  {
    id: "vektor",
    account: "Vektor Logistics",
    region: "Nordics",
    channel: "Reseller",
    stage: "RFP / offer given",
    owner: "Elias Niemi",
    closeDate: "04 Sep 2026",
    nextQuarter: "EUR 96k",
    deviceRevenue: "EUR 610k",
    serviceRevenue: "EUR 218k",
    total: "EUR 828k",
    risk: "On track",
    riskDetail: "Updated yesterday",
    suggestion: "Ask the reseller to confirm the customer test window and decision owner.",
    evidence: [
      "Offer v3 was opened by the reseller yesterday.",
      "Customer test is the next valid reseller stage.",
      "Pricing approval is complete.",
    ],
    confidence: "Medium confidence",
  },
  {
    id: "lumen",
    account: "Lumen Public Safety",
    region: "UK & IE",
    channel: "Direct",
    stage: "Contract negotiation",
    owner: "Sara Miettinen",
    closeDate: "06 Jun 2026",
    nextQuarter: "EUR 420k",
    deviceRevenue: "EUR 1.42m",
    serviceRevenue: "EUR 398k",
    total: "EUR 1.82m",
    risk: "Overdue",
    riskDetail: "Close date passed 7 days ago",
    suggestion: "Update the close date or record the procurement blocker before forecast review.",
    evidence: [
      "Expected close date was 6 June.",
      "Legal review is still marked in progress.",
      "No revised procurement date is recorded.",
    ],
    confidence: "High confidence",
  },
  {
    id: "arctic",
    account: "Arctic Grid",
    region: "Nordics",
    channel: "Direct",
    stage: "Interest shown",
    owner: "Aino Lahti",
    closeDate: "20 Nov 2026",
    nextQuarter: "EUR 0",
    deviceRevenue: "EUR 520k",
    serviceRevenue: "EUR 122k",
    total: "EUR 642k",
    risk: "Early",
    riskDetail: "Discovery call booked",
    suggestion: "Capture the expected device rollout by site after the discovery call.",
    evidence: [
      "Three operating sites are listed on the account.",
      "No device trajectory has been entered.",
      "Discovery call is booked for 17 June.",
    ],
    confidence: "Medium confidence",
  },
  {
    id: "halcyon",
    account: "Halcyon Facilities",
    region: "Benelux",
    channel: "Reseller",
    stage: "Customer test",
    owner: "Oskari Lehto",
    closeDate: "29 Aug 2026",
    nextQuarter: "EUR 152k",
    deviceRevenue: "EUR 760k",
    serviceRevenue: "EUR 186k",
    total: "EUR 946k",
    risk: "On track",
    riskDetail: "Updated 3 days ago",
    suggestion: "Prepare the follow-on order structure before the pilot review.",
    evidence: [
      "Pilot includes 120 devices in one market.",
      "Account plan identifies two follow-on markets.",
      "Reseller margin is approved through offer v2.",
    ],
    confidence: "Medium confidence",
  },
];

const navigation = ["Overview", "Accounts", "Deals", "Cases", "Offers", "Forecast"];
const stages = ["Interest shown", "RFI answered", "RFP / offer given", "Customer test", "Contract negotiation"];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    Overview: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    Accounts: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M16 5.5a3 3 0 0 1 0 5.5M17 14a5 5 0 0 1 3.5 4.8V20" /></>,
    Deals: <><path d="M4 7h16v12H4zM8 7V4h8v3M4 12h16" /><path d="M10 12v2h4v-2" /></>,
    Cases: <><path d="M5 4h10l4 4v12H5z" /><path d="M14 4v5h5M8 13h8M8 17h5" /></>,
    Offers: <><path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h4" /></>,
    Forecast: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    Search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    Filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    Table: <><path d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14" /></>,
    Board: <><path d="M4 5h6v14H4zM14 5h6v9h-6z" /></>,
    Plus: <path d="M12 5v14M5 12h14" />,
    Spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" /></>,
    Chevron: <path d="m9 18 6-6-6-6" />,
    Menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    Close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function RiskLabel({ risk }: { risk: Deal["risk"] }) {
  return (
    <span className={`risk risk--${risk.toLowerCase().replace(" ", "-")}`}>
      <span aria-hidden="true" />
      {risk}
    </span>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Deals");
  const [selectedId, setSelectedId] = useState("nordcom");
  const [viewMode, setViewMode] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0]!;
  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesQuery = !query || [deal.account, deal.region, deal.owner, deal.stage]
        .some((value) => value.toLowerCase().includes(query));
      const matchesRisk = !onlyRisk || deal.risk === "At risk" || deal.risk === "Overdue";
      return matchesQuery && matchesRisk;
    });
  }, [search, onlyRisk]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2800);
  };

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="icon-button"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={menuOpen ? "Close" : "Menu"} />
        </button>
        <span className="mobile-brand">HMD Secure CRM</span>
        <span className="prototype-label">Prototype</span>
      </header>

      <aside className={menuOpen ? "sidebar sidebar--open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span>
            <strong>HMD Secure</strong>
            <small>Commercial workspace</small>
          </span>
        </div>

        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <button
              className={activeNav === item ? "nav-item nav-item--active" : "nav-item"}
              key={item}
              onClick={() => {
                setActiveNav(item);
                setMenuOpen(false);
                if (item !== "Deals") showNotice(`${item} view is ready for the next build step.`);
              }}
              type="button"
            >
              <Icon name={item} />
              <span>{item}</span>
              {item === "Cases" && <span className="nav-count">8</span>}
              {item === "Offers" && <span className="nav-count nav-count--alert">2</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-summary">
          <p>Quarter target</p>
          <strong>EUR 2.40m</strong>
          <div className="target-track" aria-label="68 percent of quarterly target covered">
            <span />
          </div>
          <small>68% covered by weighted pipeline</small>
        </div>

        <button className="profile" type="button">
          <span className="avatar">AL</span>
          <span>
            <strong>Aino Lahti</strong>
            <small>Sales Manager</small>
          </span>
          <Icon name="Chevron" />
        </button>
      </aside>

      <main className="workspace">
        <div className="topbar">
          <div>
            <div className="breadcrumb">
              <span>Commercial</span>
              <span aria-hidden="true">/</span>
              <span>{activeNav}</span>
            </div>
            <h1>{activeNav === "Deals" ? "Pipeline" : activeNav}</h1>
          </div>
          <div className="topbar-actions">
            <span className="prototype-label desktop-only">Hackathon prototype</span>
            <button className="button button--secondary" onClick={() => showNotice("View configuration saved locally.")} type="button">
              Save view
            </button>
            <button className="button button--primary" onClick={() => showNotice("New deal workflow opened.")} type="button">
              <Icon name="Plus" />
              New deal
            </button>
          </div>
        </div>

        <section className="status-strip" aria-label="Pipeline summary">
          <div>
            <span>Open pipeline</span>
            <strong>EUR 5.48m</strong>
          </div>
          <div>
            <span>Weighted, next quarter</span>
            <strong>EUR 852k</strong>
          </div>
          <div>
            <span>Needs attention</span>
            <strong className="text-warning">3 deals</strong>
          </div>
          <div>
            <span>Forecast updated</span>
            <strong>Today, 09:42</strong>
          </div>
        </section>

        <div className="view-toolbar">
          <div className="saved-views" role="tablist" aria-label="Saved views">
            <button className="saved-view saved-view--active" role="tab" aria-selected="true" type="button">
              Team pipeline
            </button>
            <button className="saved-view" role="tab" aria-selected="false" onClick={() => setOnlyRisk(true)} type="button">
              At risk
              <span>3</span>
            </button>
            <button className="saved-view" role="tab" aria-selected="false" onClick={() => showNotice("Closing this quarter view selected.")} type="button">
              Closing this quarter
            </button>
          </div>

          <div className="toolbar-controls">
            <label className="search-field">
              <span className="sr-only">Search deals</span>
              <Icon name="Search" />
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pipeline"
                type="search"
                value={search}
              />
            </label>
            <button
              aria-pressed={onlyRisk}
              className={onlyRisk ? "control-button control-button--active" : "control-button"}
              onClick={() => setOnlyRisk((active) => !active)}
              type="button"
            >
              <Icon name="Filter" />
              Risk
            </button>
            <div className="view-switch" aria-label="Pipeline layout">
              <button aria-label="Table view" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")} type="button">
                <Icon name="Table" />
              </button>
              <button aria-label="Board view" aria-pressed={viewMode === "board"} onClick={() => setViewMode("board")} type="button">
                <Icon name="Board" />
              </button>
            </div>
          </div>
        </div>

        <div className="workbench">
          <section className="records" aria-label="Deal pipeline">
            {viewMode === "table" ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Account</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Expected close</th>
                      <th scope="col">Next quarter</th>
                      <th scope="col">3-year total</th>
                      <th scope="col">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((deal) => (
                      <tr
                        className={selectedId === deal.id ? "selected-row" : ""}
                        key={deal.id}
                        onClick={() => setSelectedId(deal.id)}
                      >
                        <th scope="row">
                          <button className="account-cell" onClick={() => setSelectedId(deal.id)} type="button">
                            <span className="account-logo" aria-hidden="true">{deal.account.slice(0, 1)}</span>
                            <span>
                              <strong>{deal.account}</strong>
                              <small>{deal.region} · {deal.channel}</small>
                            </span>
                          </button>
                        </th>
                        <td><span className="stage-label">{deal.stage}</span></td>
                        <td>{deal.owner}</td>
                        <td>{deal.closeDate}</td>
                        <td className="numeric">{deal.nextQuarter}</td>
                        <td className="numeric numeric--strong">{deal.total}</td>
                        <td>
                          <RiskLabel risk={deal.risk} />
                          <small className="risk-detail">{deal.riskDetail}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDeals.length === 0 && (
                  <div className="no-results">
                    <strong>No deals match this view.</strong>
                    <button onClick={() => { setSearch(""); setOnlyRisk(false); }} type="button">Clear filters</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="board" aria-label="Deal pipeline board">
                {stages.map((stage) => {
                  const stageDeals = filteredDeals.filter((deal) => deal.stage === stage);
                  return (
                    <section className="board-column" key={stage}>
                      <header>
                        <strong>{stage}</strong>
                        <span>{stageDeals.length}</span>
                      </header>
                      {stageDeals.map((deal) => (
                        <button className="board-record" key={deal.id} onClick={() => setSelectedId(deal.id)} type="button">
                          <span>
                            <strong>{deal.account}</strong>
                            <small>{deal.channel} · {deal.region}</small>
                          </span>
                          <span className="board-record-value">{deal.total}</span>
                          <RiskLabel risk={deal.risk} />
                        </button>
                      ))}
                    </section>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="record-panel" aria-label={`${selectedDeal.account} deal details`}>
            <div className="record-panel-header">
              <div>
                <span className="record-type">Selected deal</span>
                <h2>{selectedDeal.account}</h2>
                <p>{selectedDeal.stage} · {selectedDeal.channel}</p>
              </div>
              <button aria-label="Open full deal record" className="icon-button" onClick={() => showNotice("Full record view opened.")} type="button">
                <Icon name="Chevron" />
              </button>
            </div>

            <dl className="record-facts">
              <div>
                <dt>Device revenue</dt>
                <dd>{selectedDeal.deviceRevenue}</dd>
              </div>
              <div>
                <dt>Service revenue</dt>
                <dd>{selectedDeal.serviceRevenue}</dd>
              </div>
              <div>
                <dt>Next quarter</dt>
                <dd>{selectedDeal.nextQuarter}</dd>
              </div>
              <div>
                <dt>Expected close</dt>
                <dd>{selectedDeal.closeDate}</dd>
              </div>
            </dl>

            <div className="forecast-phasing">
              <div className="section-heading">
                <h3>Revenue phasing</h3>
                <span>36 months</span>
              </div>
              <div className="phase-bars" aria-label="Revenue forecast by year">
                <div><span>2026</span><i style={{ "--bar": "38%" } as React.CSSProperties} /><strong>EUR 340k</strong></div>
                <div><span>2027</span><i style={{ "--bar": "78%" } as React.CSSProperties} /><strong>EUR 612k</strong></div>
                <div><span>2028</span><i style={{ "--bar": "43%" } as React.CSSProperties} /><strong>EUR 292k</strong></div>
              </div>
            </div>

            <section className="ai-review" aria-labelledby="ai-review-title">
              <div className="ai-review-label">
                <Icon name="Spark" />
                <span>AI suggestion · Needs review</span>
              </div>
              <h3 id="ai-review-title">{selectedDeal.suggestion}</h3>
              <div className="evidence">
                <strong>Evidence used</strong>
                <ul>
                  {selectedDeal.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="ai-meta">
                <span>{selectedDeal.confidence}</span>
                <span>3 source records</span>
              </div>
              <div className="ai-actions">
                <button className="button button--primary" onClick={() => showNotice("Suggestion accepted as a draft task.")} type="button">
                  Accept as task
                </button>
                <button className="button button--ghost" onClick={() => showNotice("Suggestion dismissed. No CRM data changed.")} type="button">
                  Dismiss
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

# HMD Secure AI-Native CRM

Prompt Sales Hackathon challenge sponsored by HMD.

## Current Setup

- The app ships with seeded demo data and a local PostgreSQL database for development.
- Production uses a separate Azure PostgreSQL Flexible Server in `rg-hmd-secure-crm`.
- The CRM assistant is backed by a dedicated Hermes/OpenClaw gateway at the production URL configured in Azure.
- `New chat` starts a fresh assistant thread; each thread keeps its own browser-side history.
- Production now points `DATABASE_URL` at `hmd-secure-crm-pg.postgres.database.azure.com` and the database is seeded with the demo CRM dataset.

## Challenge

HMD Secure is a one-year-old startup selling smart devices alongside internal and third-party services. Its 10-20 sales representatives and Technical Account Managers currently manage customer relationships through email, personal notes, and Excel.

There is no shared CRM, pipeline visibility, service history, or forecast data. The challenge is to build a CRM before these habits become entrenched, while allowing the team to shape the system around how it actually works.

The product should include AI agents that make it feel less like data entry and more like having an analyst on the team.

## Hackathon

- Format: weekend hackathon, two days
- Date: June 2026
- Deliverable: working web app and short demo
- Prize: EUR 1,000 in cash
- Deadline: Sunday at 15:00, strict with no late submissions

## Current Problems

- Deals are tracked in Excel with no shared system.
- Cases are raised by email with no status or audit trail.
- TAMs and sales representatives have no shared customer view.
- Sales managers have no pipeline visibility.
- Finance has no forecast data.
- Resolved third-party issues leave no record.
- The growing team has no institutional memory.

## Product Goals

- Keep every account, case, and deal in one place.
- Give representatives a complete pipeline with stages and values.
- Let TAMs manage open cases linked to accounts.
- Let managers see team-wide status without asking for updates.
- Give Finance a live weighted forecast at any time.
- Show every interaction on the account timeline.
- Let new representatives learn from customer history on day one.

## Business Rules

### Phased Device Purchasing

Customers roll out device purchases over time across teams, sites, and markets.

- Total opportunity value is the forecasted device volume over approximately three years.
- Forecasts must be time-phased rather than represented as one number.
- The same deal must show both near-term, such as next-quarter, and long-term three-year forecasts.
- Forecasts are cumulative and rolling.
- Initial purchases are often pilots.
- Follow-on orders should be linked to the original opportunity.

### Service Invoicing

Services use different invoicing and revenue models:

- One-off at delivery: recognized at a single point in time.
- Fixed-term packages of one to five years: contract value is known upfront and revenue is spread across the term.
- Monthly recurring on active devices: variable revenue based on an expected rate and device-count trajectory.

Service revenue must remain separate from device revenue. These models should not be flattened into one value.

### Sales Pipeline

| Stage | Win signal | Channel |
| --- | --- | --- |
| Interest shown | Low | Direct and reseller |
| RFI answered | Low-medium | Direct and reseller |
| RFP / offer given | Medium | Direct and reseller |
| Customer test | High | Direct and reseller |
| Contract negotiation | Very high | Direct only |
| Won | Final | Direct and reseller |
| Lost | Final | Direct and reseller |

Each deal must be marked as direct or reseller so the correct stages are shown. Reseller deals move directly from customer test to won or lost and do not use contract negotiation.

## Personas

### Sales Representative

Manages a book of accounts, logs conversations, and moves deals through stages.

Needs:

- See all owned accounts and deal status at a glance.
- Quickly update stage, value, and three-year time-phased forecast.
- Build offers from the pricing catalog and submit discounts.
- Track approval status in real time and receive in-app notifications.
- Open a service case from an account.
- Receive an AI-recommended next action, topic, or draft email.

Biggest frustration: losing track of a deal after a week of email.

### Technical Account Manager

Owns service relationships, handles technical issues, and coordinates third parties.

Needs:

- See assigned cases sorted by priority and age.
- See the complete service history of an account on one timeline.
- Track requests as well as complaints and identify the customer contact.
- Mark cases escalated to a third party and track their status.
- Keep internal notes for sales and working notes for technical staff.
- Know when a case is approaching its SLA deadline.

Biggest frustration: being copied into a three-day-old email thread without context.

### Sales Manager

Oversees representatives, monitors pipeline health, and drives performance against targets.

Needs:

- See the full team pipeline by stage, value, and owner.
- Identify deals that have not moved for at least 14 days.
- Reassign deals and cases between representatives and TAMs.
- See committed revenue, at-risk revenue, and the gap to target.
- Switch between quarterly, half-year, and full-year forecast views.
- Approve or reject discounted offers.

Biggest frustration: forecast meetings based on verbal updates.

### Finance

Uses pipeline data for revenue planning and maintains commercial data, but does not create deals.

Needs:

- See a weighted pipeline summary without asking Sales.
- See time-phased monthly and quarterly forecasts over three years.
- Filter forecasts by period, stage, and deal size.
- Export pipeline data to Excel.
- Maintain the pricing catalog without a developer.
- Provide the second approval on discounted offers.

Biggest frustration: having no pipeline or forecast to inspect.

## P0: Must Have

All P0 features must work for a successful submission.

- Account and contact management: accounts contain contacts, deals, cases, and an activity timeline.
- Case management: status, priority, linked service, and threaded notes.
- Deal pipeline and stages: HMD stages, direct/reseller flag, and a three-year time-phased forecast.
- Offer creation and storage: build from the catalog, retain versions, and store offers on the account.
- Offer approval workflow: discounted offers require a justification, Sales Manager approval, then Finance approval. Approved offers are locked.
- Product and pricing catalog: Finance can add, update, and retire entries without a developer.
- Service catalog: distinguish internal and third-party services and link cases to a service.
- Role-based access: Sales Representative, TAM, Sales Manager, and Finance.
- Personal dashboards: each role lands on the information most relevant to it.
- Case and deal notes: timestamped and visible to everyone with access.

## P1: Should Have

- Search and filtering across accounts, cases, and deals.
- Pipeline filters by stage, channel, and date.
- Weighted sales forecast by stage and time, covering both near-term and three-year views.
- Case activity log with every change timestamped and attributed.
- In-app notifications that can be marked read and link to the relevant record.
- Deal risk indicators for deals not updated in 14 or more days or past their expected close date.
- AI next-best-action suggestions based on the timeline and stage, using Azure OpenAI.
- Basic reporting for cases by status or service, deals by stage or owner, and close rate.

## P2: Nice to Have

- SLA and due-date tracking with approaching and overdue states.
- Excel or CSV export for forecasts and cases.
- Inbound email-to-case through Microsoft Graph.
- Outlook calendar integration for booking follow-ups from a case.
- One-paragraph AI summaries for cases with at least five notes.
- Natural-language AI forecast narratives.

## AI Agent Ideas

These are inspiration rather than fixed requirements:

- Smart contact view: enrich from a name or domain and surface relevant information first.
- Pipeline at a glance: summarize deals by stage, flag stalled deals, and suggest the next move.
- Conversational query: turn a request such as "at-risk enterprise deals in DACH" into a live answer and filter.
- Meeting to CRM: process notes or a transcript, update records, and create tasks.
- Offer drafter: draft a tailored offer from a deal and the approved catalog.
- Forecast narrative: summarize pipeline health for Finance.

## Constraints

- Cloud platform: Microsoft Azure, using the pre-provisioned tenant and resources.
- Authentication: Azure AD / Entra ID SSO using the provided app registration.
- Notifications: in-app only. Email notifications are not allowed.
- Inbound email: optional P2 email-to-case through Microsoft Graph only.
- Calendar: Outlook through Microsoft Graph API only.
- Data residency: Azure North Europe or West Europe only.
- Migration: no automated bulk migration from Excel.
- Demo data: seed realistic records; deals may be entered manually with AI assistance.
- Architecture, framework, languages, and tooling are otherwise open.

## Engineering Conventions

- Use Bun as the JavaScript and TypeScript runtime and package manager.
- Prefer Bun-native APIs over Node.js APIs when Bun provides the required capability.
- Use Node-compatible APIs only when Astro, a dependency, or the target platform requires them.

## Environment

Local development expects the following in `.env`:

- `DATABASE_URL`: local Postgres connection string.
- `OPENCLAW_URL`: Hermes/OpenClaw-compatible chat endpoint.
- `OPENCLAW_KEY`: bearer token for that endpoint.
- `ASSISTANT_MODEL`: assistant model name exposed to the gateway.

Production is wired separately through Azure Container App secrets and environment variables. Do not point the production container at `localhost`.

## Deployment

Prerequisites:

- Authenticate the Azure CLI with `az login`.
- Keep Docker running locally.
- Select the intended Azure subscription with `az account set`.

Deploy or update the current working tree:

```sh
make deploy
```

Print the current public URL:

```sh
make deploy-url
```

The Make variables `AZURE_RESOURCE_GROUP`, `AZURE_LOCATION`, `AZURE_ENVIRONMENT`, `AZURE_REGISTRY`, and `AZURE_APP` can override the default live environment.

The Azure deployment script also expects `DATABASE_URL`, `OPENCLAW_URL`, and `OPENCLAW_KEY` to be provided in the shell environment. It stores the database and assistant credentials as Container Apps secrets and references them from the app environment.

## Demo Scenario

A new user with no training should complete this flow without getting stuck:

1. A Sales Representative logs in, finds an account, and sees open deals and active cases together.
2. The representative creates a direct deal, selects its stage, and enters a 12-month forecast.
3. The representative selects devices and services from the catalog and generates an offer.
4. A TAM logs in, opens an assigned case, reads its history, adds a note, and closes it.
5. A Sales Manager immediately sees overdue deals and the weighted three-year pipeline.
6. Finance sees a quarterly time-phased forecast across three years without asking Sales.
7. The representative opens an account and sees an AI-suggested next-best action.
8. The representative submits a discount with justification; Sales Manager and Finance are notified and approve it in sequence.

Use realistic seed data. An empty database does not demonstrate the product effectively.

## Out of Scope

- Customer-facing portal
- Mobile application
- Live API integrations with third-party service providers
- Automated bulk import from Excel
- Multi-language or localization support
- Advanced BI dashboards
- Custom report builders

## Submission

Submit by email before Sunday at 15:00.

To:

- anssi.ronnemaa@hmdglobal.com
- janne.lehtosalo@hmdglobal.com

CC:

- meri.heikkinen@aaltoes.com
- olivia.ronnemaa@aaltoes.com

Partner contact: promptagents@aaltoes.com

Prompt is an Aaltoes initiative based in Espoo.

## Customer Data Model

Related to basic customer information: would be good to have basics like customer name, domain, address, VAT ID.

### Contacts

Name, role (decision — e.g. financial, budget, tech decision maker or influencer in the company), phone, and email.

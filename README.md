# ✈️ Domino Sky – AI-Powered Airline Disruption Simulator

[![Prompt War 2026](https://img.shields.io/badge/Prompt_War-2026_Project-blue.svg?style=for-the-badge&logo=target)](https://github.com/shailendrakumarbingi0161/domino-sky)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Engine Tests](https://img.shields.io/badge/Unit_Tests-15%2F15_Passed-emerald.svg?style=for-the-badge&logo=checkmarx)](tests/engineTests.ts)

> **Domino Sky** is an interactive, operations-grade airline disruption simulation and AI decision-support command center engineered for the **Prompt War 2026** competition.
> It models cascading downstream delays, aircraft rotational turnarounds, missed passenger connections, and crew duty timeouts across a 16-airport network with 100% mathematical determinism.

---

## 🌟 Key Highlights & Innovations

1. **Aviation Operations Command Center UI/UX**:
   - Deep navy radar HUD (`#070b14`), high-contrast cyan accents, and clear visual hierarchy.
   - Interactive SVG Airspace Radar Map displaying all 16 Indian airports (mega-hubs, regional hubs, and spokes) with real-time flight corridor status.
   - Chronological scrubber with 1x, 2x, 5x, and 10x replay speeds.

2. **Deterministic Delay Propagation Engine**:
   - Single source of truth. All delay minutes, passenger impacts, and crew legality limits are calculated mathematically.
   - Strict adherence to aircraft rotations, turnaround limits, and Ground Delay Programs (GDP).

3. **DELAY DNA™ – Explainable Causality Tracking**:
   - Click any flight to deconstruct its exact disruption genetics: Origin Closure → Inbound Delay → Turnaround Deficit → Downstream Propagation → Broken Connections → Crew Duty Violations.

4. **AI Dispatcher with Strict Numerical Integrity**:
   - AI serves as the operational advisor, not an ungrounded calculator.
   - Every candidate recommendation (Deploy Ramp Spare, Tail Swap, Strategic Cancellation) is pre-simulated and verified before presentation.
   - Standalone Demo Mode operates 100% offline without external API keys.

5. **Before-and-After Scenario Analytics**:
   - Side-by-side comparative inspection showing exact minutes saved, stranded passengers protected, and crew duty envelopes safeguarded.

---

## 📊 Authoritative Competition Dataset

The system uses the official competition dataset with 100% relational integrity:
- **16 Airports**: DEL, BOM, BLR, HYD (Mega-Hubs); MAA, CCU, AMD, COK (Regional Hubs); GOI, PNQ, JAI, GAU, LKO, IXC, BBI, TRV (Spokes).
- **70 Scheduled Flights**: Full day rotation across 16 active aircraft (`VT-DS01` to `VT-DS16`).
- **21 Passenger Transfers**: Monitored against station-specific Minimum Connection Times (40m - 45m).
- **16 Crew Rosters**: Checked against DGCA/FAA 600-minute (10.0h) maximum legal duty limit.
- **2 Ramp Spare Aircraft**: `VT-DS17` stationed at **BLR**, `VT-DS18` stationed at **DEL** (both available from 05:00 IST, 180 seats).

---

## 🧪 15 Mandatory Unit Tests Verified

Domino Sky features an automated test suite (`tests/engineTests.ts`) covering all 15 operational requirements:

| # | Test Scenario | Status | Verified Outcome |
| :--- | :--- | :--- | :--- |
| **01** | Airport closes with no scheduled flights | ✅ Passed | 0 delayed flights |
| **02** | Airport closes during inbound arrival | ✅ Passed | GDP hold applied; arrival delayed to reopening (+80m) |
| **03** | Airport closes during scheduled departure | ✅ Passed | Ground stop holds departure to reopening (+60m) |
| **04** | One aircraft operates multiple legs | ✅ Passed | VT-DS01 5 sequential legs verified |
| **05** | Delayed flight propagates to next flight | ✅ Passed | Downstream rotation inherits delay |
| **06** | Aircraft turnaround prevents early departure | ✅ Passed | Turnaround buffer enforced before earliest departure |
| **07** | Passenger connection is missed | ✅ Passed | Transfer window deficit flags stranded passengers |
| **08** | Passenger connection is maintained | ✅ Passed | Unaffected connections verified as maintained |
| **09** | Crew legal duty limit reached | ✅ Passed | CR03 exceeds 600m; operation flagged illegal |
| **10** | Ramp spare aircraft is available | ✅ Passed | VT-DS17 (BLR) and VT-DS18 (DEL) verified |
| **11** | Spare aircraft unavailable at spoke airports | ✅ Passed | Spoke stations correctly verified as having no spares |
| **12** | Aircraft swap feasibility checked | ✅ Passed | 30 viable evaluated swap candidates generated |
| **13** | Flight cancellation updates passenger impact | ✅ Passed | Strategic cancellation isolates downstream cascade |
| **14** | Disruption comparison across different hubs | ✅ Passed | DEL closure vs BOM closure produces distinct profiles |
| **15** | Deterministic reproducibility check | ✅ Passed | 100% bit-for-bit identical results on repeated runs |

Run tests anytime:
```bash
npx tsx tests/engineTests.ts
```

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, Server-side API routes)
- **Language**: TypeScript (Strict typing across all aviation entities)
- **Styling**: Tailwind CSS (Dark navy command center palette)
- **Charts & Data Viz**: Recharts (Hourly waveforms, comparative bar charts)
- **Interactive Radar Map**: Custom SVG Geo-Engine with curved flight corridors
- **State Management**: Centralized React Simulation Context

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js 18.x or 20.x
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/shailendrakumarbingi0161/domino-sky.git
cd domino-sky

# Install dependencies
npm install

# Run the automated test suite
npx tsx tests/engineTests.ts

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

Domino Sky is designed for zero-config production deployment on Vercel:

1. Push your repository to GitHub under `shailendrakumarbingi0161/promptwars`.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Next.js**.
4. Click **Deploy**.

---

## 👨‍💻 Author & Attribution

- **Developer**: Shailendra Kumar Bingi ([@shailendrakumarbingi0161](https://github.com/shailendrakumarbingi0161))
- **Event**: Prompt War 2026
- **Project**: Domino Sky – AI-Powered Airline Disruption Simulator
- **License**: MIT

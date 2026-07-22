# Samthing Frantastic (working slug: adventure-trip-2026)

Sam and Fran are planning a 3-5 week outdoor adventure trip departing approximately 29 August 2026. This project is a set of visual planning pages, hosted on GitHub Pages, that start as inspiration/discussion material and evolve into a functional reference for the trip.

## Problem

Planning a multi-week, multi-destination adventure trip involves comparing regions, courses, weather windows, budgets, and booking deadlines. That is hard to do in chat threads or scattered notes. Sam and Fran need a shared, visual, evolving reference they can both look at, discuss against, and update as decisions land.

## Trip parameters (from Sam)

- Travellers: Sam and Fran, departing from Brisbane, Australia.
- Dates: fixed at five weeks, departing 1 September 2026, returning in the 3-8 October window.
- Shape: Italy first and capped at about two weeks (Dolomites hiking, then the lead course and gear in Arco); the remaining three weeks stay deliberately unplanned, chosen on the road from researched candidates (Montenegro, the Albanian Alps and Kalymnos lead).
- Primary goal: complete a lead rope climbing course, buy one full climbing kit each (harnesses and shoes already owned), then optionally climb elsewhere. The course is the anchor; extra climbing is a bonus.
- Secondary goals: hiking, outdoor adventure, great food, amazing sights.
- Not interested in generic tourist activities. A little nightlife only where it aligns with other plans.
- Budget: good bang for buck. Reasonable and economic by default, open to splurging with good reason.
- Geography: one country or several, but minimise transit relative to adventuring. Anywhere except Australia/NZ (too local). Initial thoughts: Dolomites/Italy, maybe Greece.
- Weather: warm but not too hot.

## Scope

A static multi-page site published at a GitHub Pages URL:

- Overview page: trip goals, dates, current decision status.
- Destination comparison: candidate regions with pros/cons, weather, costs.
- Lead course options: providers, prices, durations, booking notes.
- Itineraries: a recommended 3-week core plan plus 4-week and 5-week extensions, and at least one alternative plan shape.
- Gear: what to buy for lead climbing, rough costs, where to buy.
- Logistics and budget: flights, intra-trip transit, booking deadlines, rough budget.
- Open decisions: the questions Sam and Fran still need to settle.

## Non-goals

- No backend, accounts, or booking integrations. Static pages only.
- Not a live itinerary tracker or map app. It can evolve toward reference material but stays static.
- Not a general-purpose trip planner product. This is for this one trip.

## Approach

- Research-backed content: real course providers, real seasonal weather, real logistics, gathered via web research at build time.
- Plain HTML/CSS (no framework), self-contained, mobile-friendly, published via GitHub Pages on `xariov/adventure-trip-2026`.
- Prototype mandate: build the full site immediately after graduation and publish it, then refine through discussion. The first version is for initial discussions; content updates land as decisions are made.

## ADR-worthy decisions noted during shaping

- Static site over interactive app: discussion material first, so content beats machinery.
- Publish publicly on GitHub Pages: shareable between Sam and Fran on any device with no auth friction.

# AI Guidance — Job Application Tracker ✦

## Purpose
This file documents how AI tools (specifically **Antigravity**) were utilized during development and the constraints applied to protect system integrity and ensure high-quality, production-ready code.

## What AI Was Used For
- **Architectural Refactoring**: Managing the complex transition from SQLite to **Neon PostgreSQL**, including the implementation of native ENUM types.
- **Performance Engineering**: Implementing a `ThreadedConnectionPool` with keep-alive pings to solve serverless cold start issues.
- **UI/UX Design Systems**: Designing a custom **Sienna & Orange editorial theme** and implementing it across multiple React components.
- **Boilerplate Scaffolding**: Drafting initial Service layer logic, Marshmallow schemas, and Vite/React routing structures.
- **TypeScript & Type Safety**: Resolving casting errors and index signature issues in the Dashboard UI.

## What AI Was NOT Allowed To Decide
- **State Machine Transitions**: Valid states and transition rules (e.g., `APPLIED` → `SCREENING`) are core business logic defined and owned by the developer.
- **Database Schema Constraints**: Choices of column types, check constraints, and relationship cardinalities were decided manually.
- **Error Visibility**: The strategy for which errors are surfaced to the user versus those logged silently for security remained a developer-level decision.
- **Security Paradigms**: Placement of input validation at the API boundary and enforcement of parameterized queries were never delegated.

## How AI Output Was Reviewed
Every AI-generated code block was:
1. Read line-by-line before being accepted into the codebase.
2. Tested manually against edge cases (e.g., malformed JSON, database downtime).
3. Verified against the project's **Editorial Design Guidelines** to ensure visual consistency.

## Coding Standards Enforced Regardless of AI Output
- **Parameterized SQL**: All database interactions use `%s` placeholders—zero direct string interpolation.
- **Unified API Response**: Every endpoint strictly returns a `{ success, data, error }` JSON structure.
- **Business Logic Centralization**: Logic lives exclusively in `models.py` or dedicated Services—never in routes or components.
- **Graceful Failure**: External service calls (like Gemini API) are wrapped in robust error handling so that AI downtime never breaks core tracking functionality.

## What Was Intentionally Left to AI
- Repetitive CRUD logic once the primary pattern was established.
- Markdown formatting for technical documentation (README, AI_GUIDANCE).
- Standardizing Tailwind utility classes across multiple UI cards.

## Known AI-Generated Code That Was Modified
- **Gemini Integration**: Initial AI suggestion was a blocking sync call. Modified to an event-driven flow during state transition with `try/except` to ensure intel failure is non-breaking.
- **Connection Management**: Initial scripts opened/closed connections per request. Manually refactored to use a **Threaded Pool** to optimize for high-concurrency and Neon's connection limits.
- **Color Palettes**: Replaced default "violet/indigo" AI suggestions with a custom-engineered sienna/cream palette to fit the editorial brand.

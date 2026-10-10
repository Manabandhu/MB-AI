# ADR 0006: Module-owned Home widgets and launcher metadata

Status: accepted (2026-10)

Home used to depend on a backend aggregate that returned fixed cards, plus a hardcoded list of module labels, colours, and marketing copy in the foundation module. Changing any module meant editing Home.

Decision:

- Each business module declares its launcher entry in `<module>/module.ts` (`ModuleMeta` from `@manabandhu/core`: label, summary, route, icon, tone, category, default rank, supported surfaces) and exposes a public `index.ts`.
- Modules that have something useful for Home export a widget (`RoomsHomeWidget`, …) built on the shared `WidgetFrame`. The widget owns its query, loading skeleton, error state, and empty state, and calls only its own module's API.
- `foundation/home/registry.ts` lists the widgets in order; `foundation/launcher/moduleRegistry.ts` lists the modules. Home and Explore only arrange what modules provide.
- Each widget is wrapped in an error boundary and fails independently. Widgets never show sample data.

Consequences: a module can change, add, or remove its Home card without touching foundation code; no backend change is needed for Home. The backend `foundation/screens/home` endpoint now only supplies aggregate counts.

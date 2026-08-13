# ADR 0004: Canonical screen catalog and module ownership

Status: accepted

The typed catalog at `frontend/src/modules/screen-catalog.ts` is the canonical inventory for product screens and route identities. It separates repeated labels such as Search, Map, Filters, Reports, Details, and Saved through module-qualified IDs and paths.

Each business capability owns a folder under `frontend/src/modules`, a `MODULE.md`, and a coupled AI skill. Expo Router files remain thin adapters. Catalog presence records product scope; it does not claim that a screen is implemented. Implementation proceeds module by module using available Stitch references and the shared design system.

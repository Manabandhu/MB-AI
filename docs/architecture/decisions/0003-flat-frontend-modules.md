# ADR 0003: Flat frontend workspace with feature modules

Status: accepted

The active Expo application lives directly at `frontend/`. Empty `universal`, watch, and TV wrapper folders are removed. Possible watch and TV targets remain design considerations but receive application folders only when implementation begins.

Business capabilities live under `frontend/src/modules/<module>`. Each module owns its screens, components, API adapters, schemas, state, hooks, and tests. Expo Router files under `frontend/src/app` stay thin and delegate to module implementations.

Cross-module imports use intentional public exports rather than another module's internal paths. Shared transport, device, and platform adapters remain under `frontend/src/lib` and `frontend/src/platform`; reusable visual foundations remain in the design-system package.

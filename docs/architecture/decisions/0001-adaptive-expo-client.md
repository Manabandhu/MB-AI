# ADR 0001: One adaptive Expo client

Status: accepted

Use one Expo Router application with React Native Web for current phone, tablet, foldable, browser, and desktop-web surfaces. Select layouts by available window size and capabilities, never by device-name allowlists.

Keep navigation, interaction density, and composition adaptive. Do not assume orientation, fixed pixel dimensions, touch-only input, or a permanent hinge position.

Watch and TV remain separate future application shells because their interaction models and release pipelines differ materially. They may reuse contracts, domain logic, tokens, and backend services.

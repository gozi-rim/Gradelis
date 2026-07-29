# Feature-based Frontend Architecture

This project organizes UI code by feature to keep growth maintainable.

## Structure

- `features/<feature-name>/screens` – route-level screen compositions
- `features/<feature-name>/components` – feature-specific UI parts
- `shared/ui` – reusable UI primitives shared across features
- `shared/lib` – shared utility functions

## Convention

1. Keep route files in `app/**/page.tsx` very thin.
2. Compose each route from a screen in `features/**/screens`.
3. Keep shared primitives generic and dependency-light.
4. Keep feature components close to the feature that owns them.

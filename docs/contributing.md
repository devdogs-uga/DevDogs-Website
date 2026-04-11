---
title: Contributing
description: Guidelines for contributing to the DevDogs Website.
---

# Contributing

Thanks for helping improve the DevDogs Website!

## Workflow

1. **Fork** the repository and create a feature branch from `main`.
2. **Make your changes** — keep commits focused and descriptive.
3. **Open a pull request** targeting `main`. Fill out the PR template.

## Code style

- TypeScript everywhere — avoid `any`.
- Run `pnpm check` before pushing (lints, typechecks, and formats).
- Prefer editing existing files over creating new ones.

## Database changes

Schema lives in `src/server/db/schema/`. After editing, run:

```bash
pnpm db:push
```

This pulls the introspected schema, pushes migrations, and regenerates Supabase types.

## Documentation

Add or update markdown files in `docs/` alongside your code changes. Use the local preview to check rendering:

```bash
pnpm docs:preview
```

---
title: Getting Started
description: Set up the DevDogs Website locally for development.
---

# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- [pnpm](https://pnpm.io) 9 or later
- [Docker](https://www.docker.com) (for the local Supabase instance)

## Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/DevDogs-UGA/DevDogs-Website.git
   cd DevDogs-Website
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the local Supabase instance and dev server**

   ```bash
   pnpm dev
   ```

   This starts Supabase locally, runs database migrations, and launches the Next.js dev server at `http://localhost:3000`.

## Local docs preview

To preview documentation changes before pushing:

```bash
pnpm docs:preview
```

Then visit `/docs/local` on the running site. The page auto-refreshes when you edit any file in `docs/`.

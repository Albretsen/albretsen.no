# albretsen.no

Personal landing page for Asgeir Albretsen.

## Stack

- React 19
- Vite
- TypeScript
- Static assets from `public/`

## Local development

Development runs on the dev tunnel target:

```bash
npm install
npm run dev
```

This serves the site on:

- `http://localhost:3001`
- intended tunnel target: `https://dev.albretsen.no`

## Preview / production-like local run

```bash
npm run build
npm run preview
```

This serves the built app on:

- `http://localhost:3000`
- intended tunnel target: `https://albretsen.no`

## Container

```bash
npm run podman:build
npm run podman:run
```

## Notes for the agent

- Keep changes incremental and reviewable.
- Ask before adding unverified personal claims.
- Use `agent/work` for autonomous changes unless told otherwise.

# web-sales

Sales simulator of the JonomaIT lab (runtime `cloudfront`): `vendas.joshuel.com.br`. Create sales, watch each one go from pending to processed, see which region took it and which processed it, and get told when another region starts answering (a failover, ADR-012).

Built from [`template-web-react`](https://github.com/JonomaIT/template-web-react): React, TypeScript, Vite and [Cloudscape](https://cloudscape.design), the design system of the AWS consoles.

```
browser ─► vendas.joshuel.com.br ─► Cloudflare ─► CloudFront ─► S3 (private, OAC)          the site
browser ─► sales.joshuel.com.br  ─► Cloudflare ─► Load Balancer ─► ALB ─► svc-sales-api   its calls
                                        svc-sales-api ─► SNS ─► SQS (both regions) ─► svc-sales-worker (ACTIVE region)
```

| Page           | What it shows                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/` overview   | the region answering the API and its state (`ACTIVE`/`PASSIVE`, every 15 s), the sales of this browser, the average time to process |
| `/vendas`      | table of this browser's sales: filter, sorting, pagination, column preferences, bulk delete, "create 5 test sales"                  |
| `/vendas/nova` | form with the API's own rules, checked before sending                                                                               |
| `/vendas/<id>` | one sale: status, regions, times, receipt key; polled every second while pending                                                    |

The API has no "list sales" (it would need a table `Scan`, which its data-access policy does not grant, ADR-011): the site keeps the IDs it created in `localStorage` and asks for each one. A sale still pending after 90 s is shown as stuck: nobody is processing (the ACTIVE worker is down and the failover has not happened yet).

## Run it

```bash
nvm use            # Node from .nvmrc
npm ci
npm run dev        # http://localhost:5173, API simulated in the browser (no backend, no credentials)
```

`npm run dev` runs with the API **simulated** by [Mock Service Worker](https://mswjs.io) (`src/mocks`), with the same contract as `svc-sales-api`: sales turn processed after 1.5 s. In the browser console, `mockFailover()` moves the simulated API to the other region and the site shows the failover notice on its next check.

| Script              | Does                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | dev server with the simulated API                                     |
| `npm test`          | unit and page tests (Vitest, Testing Library, the same simulated API) |
| `npm run lint`      | ESLint (with the React Compiler rules) and Prettier                   |
| `npm run typecheck` | TypeScript, strict                                                    |
| `npm run build`     | the production site in `dist/` (no mock code in it)                   |

## How it is built

```
src/
├── main.tsx            loads /config.json, then renders (the simulated API only in `npm run dev`)
├── app/                layout (top bar, side navigation, breadcrumbs, notifications), routes, theme
├── api/client.ts       the one way to call the API: timeout, errors with the API's message, X-Region
├── features/sales/     types, API calls, queries (TanStack Query: cache, polling, retries), rules
├── pages/              one per route, each loaded on first visit
├── mocks/              the simulated svc-sales-api (dev and tests)
└── test/               test setup and renderApp(path): the whole app on a route
```

- **Runtime configuration.** The API address is not in the bundle: the site reads `/config.json` (`environment`, `apiUrl`) before rendering, so the same build serves every environment (_build once, deploy many_). `public/config.json` holds production's.
- **Server state in TanStack Query**: one cache, polling while a sale is pending, retries for network errors and 5xx, never for 4xx.
- **Errors never blank the page**: route errors show an alert, API errors show where they happened.
- **Accessible by default**: Cloudscape components, labels on every control, and tests that find elements by role and name, as a screen reader would.
- **pt-BR** everywhere, Cloudscape's own messages included (`I18nProvider`).

## Pipeline and deploy

`ci.yml` calls `build-static` from [`pipelines`](https://github.com/JonomaIT/pipelines) on every pull request and on `main`: `npm ci`, lint, typecheck, tests, build and a Trivy scan of the dependencies; on `main` the built `dist/` is kept as the `site` artifact.

The infrastructure (private bucket, distribution, public name) comes from the `cloudfront` runner with the `cloudfront-site` and `app-dns` patterns of [`terraform-modules`](https://github.com/JonomaIT/terraform-modules); `deploy/app.hcl` says the site is in `dist` and is a single-page app.

**The pipeline deploys** (`deploy-app` of `pipelines`): on `main` when the `AUTO_DEPLOY` org variable is `true` (the lab is up), or by hand in *Actions → CI → Run workflow* (`destroy` removes the app, data last). It runs, in the production GitHub Environment, the infrastructure, the upload of the `site` artifact and the invalidation. By hand, the same steps:

1. Infrastructure, from `pipelines/terraform-runner/cloudfront` (state key `production/global/apps/web-sales`):

   ```bash
   terraform apply -var-file=../../../web-sales/deploy/app.hcl \
     -var-file=../../../web-sales/deploy/env/production.tfvars -var environment=production
   ```

2. Files: hashed assets cached for a year, `index.html` and `config.json` always revalidated, then invalidate:

   ```bash
   npm ci && npm run build
   aws s3 sync dist/assets "s3://$BUCKET/assets" --cache-control "public, max-age=31536000, immutable"
   aws s3 sync dist "s3://$BUCKET" --delete --exclude "assets/*" --cache-control "no-cache"
   aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/index.html" "/config.json"
   ```

Another environment gets its own `config.json` at deploy time; the build is the same.

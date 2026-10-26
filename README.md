# web-sales

Sales simulator of the JonomaIT lab (runtime `cloudfront`): `vendas.joshuel.com.br`. Create sales (one or five at a time) and watch each one go from `PENDING` to `PROCESSED`, with the region that took it, the region that processed it and how long it took. The header shows which region is answering and whether it is `ACTIVE` or `PASSIVE`, refreshed every 15 s: leave it open during a game day and watch the failover.

```
browser ─► vendas.joshuel.com.br ─► Cloudflare ─► CloudFront ─► S3 (private, OAC)              the page
browser ─► sales.joshuel.com.br  ─► Cloudflare ─► Load Balancer ─► ALB ─► svc-sales-api       its calls
                                                       svc-sales-api ─► SNS ─► SQS (both regions) ─► svc-sales-worker (ACTIVE region)
```

The API ([`svc-sales-api`](https://github.com/JonomaIT/svc-sales-api)) accepts browser calls only from this site (`ALLOWED_ORIGINS`) and exposes `X-Region`. A sale still `PENDING` after ~1.5 min is shown as `STUCK`: nobody is processing (e.g. the ACTIVE region's worker is down and the failover has not happened yet).

```
site/            the files, uploaded as they are (no build step)
deploy/
├── app.hcl      runtime = "cloudfront", source_dir, spa
└── env/production.tfvars   hosts
```

The infrastructure (private bucket, distribution, public name) comes from the `cloudfront` runner in [`pipelines`](https://github.com/JonomaIT/pipelines) with the `cloudfront-site` and `app-dns` patterns of [`terraform-modules`](https://github.com/JonomaIT/terraform-modules): a new site is a repo with `site/` and two small files, no Terraform.

## Deploy (by hand, until the deploy pipeline exists)

1. Infrastructure, from `pipelines/terraform-runner/cloudfront` (state key `production/global/apps/web-sales`):

   ```bash
   terraform apply -var-file=../../../web-sales/deploy/app.hcl \
     -var-file=../../../web-sales/deploy/env/production.tfvars -var environment=production
   ```

2. Files: everything with a long cache, then HTML/CSS/JS with `no-cache` (the browser always revalidates them), then invalidate CloudFront:

   ```bash
   aws s3 sync site "s3://$BUCKET" --delete --cache-control "public, max-age=604800"
   aws s3 cp site "s3://$BUCKET/" --recursive --exclude "*" --include "*.html" --include "*.css" --include "*.js" --cache-control "no-cache"
   aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*"
   ```

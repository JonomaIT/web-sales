runtime    = "cloudfront"
name       = "web-sales"
source_dir = "dist" # what `npm run build` writes (the pipeline builds every web-* with package.json)
spa        = true   # client-side routes (/vendas/<id>): unknown paths return index.html

# Kazu Games task runner

# Show recipes with short descriptions (`just` uses `[doc]` / `[group]` for --list).

[doc("Print available recipes and what they do")]
default:
    @just --list

[group("development")]
[doc("Start the web app dev server (apps/web)")]
dev:
    cd apps/web && bun run dev

[group("development")]
[doc("Delete apps/web/.next only — fixes dev MODULE_NOT_FOUND ./NN.js and stale *.hot-update.json 404s")]
clean-next:
    rm -rf apps/web/.next

[group("development")]
[doc("Remove apps/web/.next then start dev (use after next build or HMR / chunk errors)")]
dev-clean: clean-next
    cd apps/web && bun run dev

[group("database")]
[doc("Apply local migrations to the linked Supabase database")]
db-push:
    bunx supabase db push

[group("database")]
[doc("Pull remote schema changes into a new local migration")]
db-pull:
    bunx supabase db pull

[group("database")]
[doc("Reset the linked remote database (destructive)")]
db-reset:
    bunx supabase db reset --linked

[group("database")]
[doc("Regenerate TypeScript DB types into apps/web")]
db-types:
    bunx supabase gen types typescript --linked > apps/web/lib/supabase/database.types.ts

[group("database")]
[doc("Attach Supabase CLI to a project (pass dashboard project ref)")]
db-link project_ref:
    bunx supabase link --project-ref {{project_ref}}

[group("database")]
[doc("Open browser login for Supabase CLI")]
db-login:
    bunx supabase login

[group("build")]
[doc("Production build for the web app (rebuilds scraper first)")]
build:
    cd packages/deku-scraper && bun run build
    cd apps/web && bun run build

[group("build")]
[doc("Run package tests for deku-scraper only")]
test:
    cd packages/deku-scraper && bun test

[group("build")]
[doc("Run apps/web unit tests (API routes, etc.)")]
test-web:
    cd apps/web && bun test __tests__

[group("build")]
[doc("Run all workspace tests (bun --recursive)")]
test-all:
    bun test --recursive

[group("build")]
[doc("Lint the web app")]
lint:
    cd apps/web && bun run lint

[group("build")]
[doc("Compile/build the deku-scraper package")]
scraper-build:
    cd packages/deku-scraper && bun run build

[group("deploy")]
[doc("Deploy the web app to Vercel")]
deploy-web:
    bunx vercel deploy

[group("deploy")]
[doc("Deploy the deku-scraper package to Vercel")]
deploy-scraper:
    cd packages/deku-scraper && bunx vercel deploy

[group("deploy")]
[doc("Deploy the web app and deku-scraper package to Vercel")]
deploy: 
    {{just_executable()}} deploy-web
    {{just_executable()}} deploy-scraper
    @echo "Deploy done. Visit https://vercel.com/dashboard to view the deployed projects."

[group("setup")]
[doc("Remove build outputs, Bun PM cache, workspace node_modules, and common tool caches")]
clean:
    rm -rf apps/web/.next apps/web/out apps/web/build
    rm -rf packages/deku-scraper/dist
    rm -rf .turbo coverage .vercel
    find . -name '*.tsbuildinfo' ! -path '*/node_modules/*' -type f -exec rm -f {} +
    find . -name '.eslintcache' ! -path '*/node_modules/*' -type f -exec rm -f {} +
    find . -name node_modules -type d -prune -exec rm -rf {} +
    bun pm cache rm
    @echo "Clean done. Run 'bun install' (or 'just setup') before building again."

[group("setup")]
[doc("Install deps and ensure supabase is initialized; then link a project")]
setup:
    bun install
    bunx supabase init || true
    @echo "Run 'just db-link <project-ref>' to connect to your Supabase project"
    @echo "Setting up .env.local..."
    [ -f apps/web/.env.local ] || cp apps/web/.env.local.example apps/web/.env.local
    @echo "Done. Run 'just dev' to start the web app."
    @echo "Then visit http://localhost:3000 to see the app."
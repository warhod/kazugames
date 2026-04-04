# deku-tracker task runner

# Default recipe
default:
    @just --list

# ─── Development ──────────────────────
dev:
    cd apps/web && bun run dev

# ─── Database ─────────────────────────
db-push:
    bunx supabase db push

db-pull:
    bunx supabase db pull

db-reset:
    bunx supabase db reset --linked

db-types:
    bunx supabase gen types typescript --linked > apps/web/lib/supabase/database.types.ts

db-link project_ref:
    bunx supabase link --project-ref {{project_ref}}

# ─── Build & Test ─────────────────────
build:
    cd apps/web && bun run build

test-all:
    bun test --recursive

lint:
    cd apps/web && bun run lint

# ─── Deku Scraper ──────────────────────────
scraper-build:
    cd packages/deku-scraper && bun run build

test:
    bun test

# ─── Setup ────────────────────────────
setup:
    bun install
    ; bunx supabase init || true
    ; @echo "Run 'just db-link <project-ref>' to connect to your Supabase project"

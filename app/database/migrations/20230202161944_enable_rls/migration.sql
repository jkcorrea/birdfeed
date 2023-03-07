-- Enable RLS
alter table if exists "_prisma_migrations" ENABLE row level security;
alter table if exists "users" ENABLE row level security;
alter table if exists "tweet" ENABLE row level security;
alter table if exists "transcript" ENABLE row level security;
alter table if exists "prices" ENABLE row level security;
alter table if exists "prices_currencies" ENABLE row level security;
alter table if exists "subscriptions" ENABLE row level security;
alter table if exists "tiers" ENABLE row level security;
alter table if exists "tiers_limit" ENABLE row level security;

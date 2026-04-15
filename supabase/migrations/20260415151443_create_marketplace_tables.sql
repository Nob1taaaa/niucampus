-- Marketplace listings
create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  price numeric default 0,
  is_free boolean default false,
  is_urgent boolean default false,
  is_sold boolean default false,
  category text not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_listings enable row level security;

create policy "Listings viewable by authenticated" on public.marketplace_listings for select to authenticated using (true);
create policy "Users can create listings" on public.marketplace_listings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own listings" on public.marketplace_listings for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own listings" on public.marketplace_listings for delete to authenticated using (auth.uid() = user_id);

-- Listing images
create table public.marketplace_listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  image_url text not null,
  position integer default 0,
  created_at timestamptz not null default now()
);

alter table public.marketplace_listing_images enable row level security;

create policy "Images viewable by authenticated" on public.marketplace_listing_images for select to authenticated using (true);
create policy "Listing owners can insert images" on public.marketplace_listing_images for insert to authenticated
  with check (listing_id in (select id from public.marketplace_listings where user_id = auth.uid()));
create policy "Listing owners can delete images" on public.marketplace_listing_images for delete to authenticated
  using (listing_id in (select id from public.marketplace_listings where user_id = auth.uid()));

-- Wanted board
create table public.marketplace_wanted (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  budget numeric,
  category text default 'other',
  is_fulfilled boolean default false,
  created_at timestamptz not null default now()
);

alter table public.marketplace_wanted enable row level security;

create policy "Wanted posts viewable by authenticated" on public.marketplace_wanted for select to authenticated using (true);
create policy "Users can create wanted posts" on public.marketplace_wanted for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own wanted posts" on public.marketplace_wanted for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own wanted posts" on public.marketplace_wanted for delete to authenticated using (auth.uid() = user_id);

-- Marketplace chats
create table public.marketplace_chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.marketplace_chats enable row level security;

create policy "Chat participants can view" on public.marketplace_chats for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can create chats" on public.marketplace_chats for insert to authenticated
  with check (auth.uid() = buyer_id);

-- Marketplace messages
create table public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.marketplace_chats(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.marketplace_messages enable row level security;

create policy "Chat participants can view messages" on public.marketplace_messages for select to authenticated
  using (chat_id in (select id from public.marketplace_chats where buyer_id = auth.uid() or seller_id = auth.uid()));
create policy "Chat participants can send messages" on public.marketplace_messages for insert to authenticated
  with check (auth.uid() = sender_id and chat_id in (select id from public.marketplace_chats where buyer_id = auth.uid() or seller_id = auth.uid()));

-- Enable realtime for messages
alter publication supabase_realtime add table public.marketplace_messages;
alter publication supabase_realtime add table public.marketplace_chats;

-- Storage bucket for marketplace images
insert into storage.buckets (id, name, public) values ('marketplace-images', 'marketplace-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can view marketplace images" on storage.objects for select using (bucket_id = 'marketplace-images');
create policy "Authenticated can upload marketplace images" on storage.objects for insert to authenticated with check (bucket_id = 'marketplace-images');
create policy "Users can delete own marketplace images" on storage.objects for delete to authenticated using (bucket_id = 'marketplace-images' and (storage.foldername(name))[1] = auth.uid()::text);

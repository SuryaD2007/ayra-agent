-- Spaces a user owns (Personal/Work/School/etc.)
create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  visibility text not null default 'private', -- 'private' | 'team' (future)
  created_at timestamptz not null default now()
);

-- Items (note/pdf/link/image)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid references spaces(id) on delete set null,
  type text not null, -- 'note' | 'pdf' | 'link' | 'image'
  title text not null,
  source text,           -- 'Upload' or domain (for links)
  content text,          -- note text OR extracted text OR link summary
  file_path text,        -- storage path for uploaded files
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Tags and pivot
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

create table if not exists item_tags (
  item_id uuid references items(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

-- Basic RLS
alter table spaces enable row level security;
alter table items  enable row level security;
alter table tags   enable row level security;
alter table item_tags enable row level security;

create policy "own spaces" on spaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own items" on items
  for all using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy "own tags" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own item_tags" on item_tags
  for all using (
    exists (select 1 from items i where i.id = item_id and i.user_id = auth.uid())
  ) with check (
    exists (select 1 from items i where i.id = item_id and i.user_id = auth.uid())
  );

-- Storage bucket for files
insert into storage.buckets (id, name, public) values ('ayra-files', 'ayra-files', false);

-- Storage policies
create policy "Users can upload their own files" on storage.objects
  for insert with check (
    bucket_id = 'ayra-files' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own files" on storage.objects
  for select using (
    bucket_id = 'ayra-files' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own files" on storage.objects
  for update using (
    bucket_id = 'ayra-files' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files" on storage.objects
  for delete using (
    bucket_id = 'ayra-files' and 
    auth.uid()::text = (storage.foldername(name))[1]
  );
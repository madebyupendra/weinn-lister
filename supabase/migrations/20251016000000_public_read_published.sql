-- Allow public (anon, authenticated) to read published properties
create policy if not exists "Public can read published properties"
on public.properties
for select
to anon, authenticated
using (status = 'published');

-- Allow public to read photos of published properties
create policy if not exists "Public can read photos of published properties"
on public.property_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_photos.property_id
      and p.status = 'published'
  )
);

-- Optional: allow public to read rooms of published properties
create policy if not exists "Public can read rooms of published properties"
on public.property_rooms
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_rooms.property_id
      and p.status = 'published'
  )
);


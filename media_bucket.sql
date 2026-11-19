-- Publiczny bucket na zdjęcia i filmy (limit 50 MB na plik)
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true;

create policy "Authenticated can view consultas animais"
on storage.objects for select to authenticated
using (bucket_id = 'consultas-animais');

create policy "Gestor or admin can upload consultas animais"
on storage.objects for insert to authenticated
with check (bucket_id = 'consultas-animais' and public.is_gestor_or_admin());

create policy "Gestor or admin can update consultas animais"
on storage.objects for update to authenticated
using (bucket_id = 'consultas-animais' and public.is_gestor_or_admin());

create policy "Gestor or admin can delete consultas animais"
on storage.objects for delete to authenticated
using (bucket_id = 'consultas-animais' and public.is_gestor_or_admin());
-- Nexio CRM: grava a versão instalada para o rodapé da barra lateral
-- Rodar no Supabase > SQL Editor. Ao trocar a versão das imagens no compose, troque aqui também.
insert into public.system_version (id, current_version, latest_version, off_release, updated_at)
values (1, 'v1.124.0', 'v1.124.0', false, now())
on conflict (id) do update
  set current_version = excluded.current_version,
      latest_version  = excluded.latest_version,
      off_release     = false,
      updated_at      = now();

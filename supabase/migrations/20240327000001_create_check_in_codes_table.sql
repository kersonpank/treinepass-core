create table public.check_in_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  user_id uuid not null references auth.users(id),
  academia_id uuid not null references academias(id),
  status text not null check (status in ('pending', 'used', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  used_at timestamp with time zone,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '5 minutes') not null
);

-- Criar índices para melhor performance
create index check_in_codes_user_id_idx on public.check_in_codes(user_id);
create index check_in_codes_academia_id_idx on public.check_in_codes(academia_id);
create index check_in_codes_code_idx on public.check_in_codes(code);
create index check_in_codes_status_idx on public.check_in_codes(status);

-- Habilitar RLS
alter table public.check_in_codes enable row level security;

-- Políticas de segurança
create policy "Usuários podem ver seus próprios códigos"
  on public.check_in_codes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários podem criar seus próprios códigos"
  on public.check_in_codes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Academias podem ver códigos destinados a elas"
  on public.check_in_codes for select
  to authenticated
  using (
    exists (
      select 1 from user_gym_roles
      where user_id = auth.uid()
      and gym_id = academia_id
      and active = true
    )
  );

-- Função para validar e usar um código de check-in
create or replace function public.validate_check_in_code(
  p_code text,
  p_academia_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_check_in_code record;
  v_subscription record;
begin
  -- Buscar o código
  select * into v_check_in_code
  from public.check_in_codes
  where code = p_code
  and academia_id = p_academia_id
  and status = 'pending'
  and expires_at > now()
  limit 1;

  if v_check_in_code is null then
    return jsonb_build_object(
      'valid', false,
      'message', 'Código inválido ou expirado'
    );
  end if;

  -- Verificar se o usuário tem uma assinatura ativa
  select * into v_subscription
  from public.user_plan_subscriptions
  where user_id = v_check_in_code.user_id
  and status = 'active'
  limit 1;

  if v_subscription is null then
    return jsonb_build_object(
      'valid', false,
      'message', 'Usuário não possui plano ativo'
    );
  end if;

  -- Marcar o código como usado
  update public.check_in_codes
  set status = 'used',
      used_at = now()
  where id = v_check_in_code.id;

  -- Registrar o check-in
  insert into public.check_ins (
    user_id,
    academia_id,
    subscription_id,
    check_in_code_id
  ) values (
    v_check_in_code.user_id,
    p_academia_id,
    v_subscription.id,
    v_check_in_code.id
  );

  return jsonb_build_object(
    'valid', true,
    'message', 'Check-in realizado com sucesso',
    'user_id', v_check_in_code.user_id
  );
end;
$$; 
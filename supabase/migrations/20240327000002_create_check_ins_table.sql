create table public.check_ins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  academia_id uuid not null references academias(id),
  subscription_id uuid not null references user_plan_subscriptions(id),
  check_in_code_id uuid not null references check_in_codes(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar índices para melhor performance
create index check_ins_user_id_idx on public.check_ins(user_id);
create index check_ins_academia_id_idx on public.check_ins(academia_id);
create index check_ins_subscription_id_idx on public.check_ins(subscription_id);
create index check_ins_created_at_idx on public.check_ins(created_at);

-- Habilitar RLS
alter table public.check_ins enable row level security;

-- Políticas de segurança
create policy "Usuários podem ver seus próprios check-ins"
  on public.check_ins for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Academias podem ver check-ins realizados nelas"
  on public.check_ins for select
  to authenticated
  using (
    exists (
      select 1 from user_gym_roles
      where user_id = auth.uid()
      and gym_id = academia_id
      and active = true
    )
  );

-- Função para obter estatísticas de check-in
create or replace function public.get_check_in_stats(
  p_user_id uuid,
  p_start_date timestamp with time zone default (now() - interval '30 days'),
  p_end_date timestamp with time zone default now()
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_check_ins integer;
  v_unique_gyms integer;
  v_most_visited_gym record;
  v_check_ins_by_day json;
begin
  -- Total de check-ins no período
  select count(*) into v_total_check_ins
  from public.check_ins
  where user_id = p_user_id
  and created_at between p_start_date and p_end_date;

  -- Número de academias diferentes visitadas
  select count(distinct academia_id) into v_unique_gyms
  from public.check_ins
  where user_id = p_user_id
  and created_at between p_start_date and p_end_date;

  -- Academia mais visitada
  select 
    a.nome as gym_name,
    count(*) as visit_count
  into v_most_visited_gym
  from public.check_ins c
  join public.academias a on a.id = c.academia_id
  where c.user_id = p_user_id
  and c.created_at between p_start_date and p_end_date
  group by a.id, a.nome
  order by count(*) desc
  limit 1;

  -- Check-ins por dia
  select json_agg(
    json_build_object(
      'date', date,
      'count', count
    )
  ) into v_check_ins_by_day
  from (
    select 
      date_trunc('day', created_at) as date,
      count(*) as count
    from public.check_ins
    where user_id = p_user_id
    and created_at between p_start_date and p_end_date
    group by date_trunc('day', created_at)
    order by date_trunc('day', created_at)
  ) as daily_stats;

  return jsonb_build_object(
    'total_check_ins', v_total_check_ins,
    'unique_gyms', v_unique_gyms,
    'most_visited_gym', jsonb_build_object(
      'name', v_most_visited_gym.gym_name,
      'count', v_most_visited_gym.visit_count
    ),
    'check_ins_by_day', v_check_ins_by_day
  );
end;
$$; 
-- Criar tabela de perfis de usuário
create table public.user_profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  email text not null,
  cpf text not null unique,
  birth_date date not null,
  phone_number text not null,
  asaas_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de tipos de usuário
create table public.user_types (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  type text not null check (type in ('individual', 'business', 'gym')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, type)
);

-- Habilitar RLS
alter table public.user_profiles enable row level security;
alter table public.user_types enable row level security;

-- Políticas de segurança para user_profiles
create policy "Usuários podem ver seus próprios perfis"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Usuários podem atualizar seus próprios perfis"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Usuários podem inserir seus próprios perfis"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Políticas de segurança para user_types
create policy "Usuários podem ver seus próprios tipos"
  on public.user_types for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios tipos"
  on public.user_types for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Função para verificar se um usuário tem um determinado tipo
create or replace function public.check_user_type(
  p_user_id uuid,
  p_type text
)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.user_types
    where user_id = p_user_id
    and type = p_type
  );
end;
$$; 
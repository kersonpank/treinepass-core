-- Create system_settings table
create table if not exists public.system_settings (
    id uuid default gen_random_uuid() primary key,
    key text not null unique,
    value jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.system_settings enable row level security;

-- Drop existing policies
drop policy if exists "Only admins can read system settings" on public.system_settings;
drop policy if exists "Only admins can insert system settings" on public.system_settings;
drop policy if exists "Only admins can update system settings" on public.system_settings;

-- Create new policies
create policy "Usuários autenticados podem ler configurações do Asaas"
    on public.system_settings for select
    using (
        auth.role() = 'authenticated' and key = 'asaas_settings'
    );

create policy "Apenas admins podem ler todas as configurações"
    on public.system_settings for select
    using (
        exists (
            select 1
            from public.user_types ut
            where ut.user_id = auth.uid()
            and ut.type = 'admin'
        )
    );

create policy "Apenas admins podem inserir configurações"
    on public.system_settings for insert
    with check (
        exists (
            select 1
            from public.user_types ut
            where ut.user_id = auth.uid()
            and ut.type = 'admin'
        )
    );

create policy "Apenas admins podem atualizar configurações"
    on public.system_settings for update
    using (
        exists (
            select 1
            from public.user_types ut
            where ut.user_id = auth.uid()
            and ut.type = 'admin'
        )
    );

-- Create trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_system_settings_updated_at
    before update on public.system_settings
    for each row
    execute procedure public.handle_updated_at(); 
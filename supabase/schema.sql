-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Branches Table
create table public.branches (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    whatsapp_number text not null,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products Table
create table public.products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    price numeric(10,2) not null,
    image_urls text[] default '{}'::text[] not null,
    category text not null,
    sizes text[] default '{"S", "M", "L", "XL", "XXL"}'::text[] not null,
    is_enabled boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Inventory Table
create table public.inventory (
    id uuid default uuid_generate_v4() primary key,
    branch_id uuid references public.branches(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    quantity integer default 0 not null check (quantity >= 0),
    price_override numeric(10,2),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(branch_id, product_id)
);

-- 4. Customers Table
create table public.customers (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text not null,
    address text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Orders Table
create table public.orders (
    id uuid default uuid_generate_v4() primary key,
    order_number text not null unique,
    customer_id uuid references public.customers(id) on delete set null,
    branch_id uuid references public.branches(id) on delete set null,
    total_amount numeric(10,2) not null,
    status text default 'pending'::text not null, -- pending, confirmed, packed, shipped, delivered, cancelled
    items jsonb not null, -- [{product_id, name, quantity, size, price}]
    payment_method text default 'whatsapp'::text not null, -- whatsapp, or future razorpay/etc.
    payment_status text default 'unpaid'::text not null, -- unpaid, paid, failed
    payment_details jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.branches enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;

-- Policies for branches
create policy "Allow public read for active branches" on public.branches
    for select using (is_active = true);

create policy "Allow authenticated admin full access to branches" on public.branches
    for all to authenticated using (true) with check (true);

-- Policies for products
create policy "Allow public read for enabled products" on public.products
    for select using (is_enabled = true);

create policy "Allow authenticated admin full access to products" on public.products
    for all to authenticated using (true) with check (true);

-- Policies for inventory
create policy "Allow public read for inventory" on public.inventory
    for select using (true);

create policy "Allow authenticated admin full access to inventory" on public.inventory
    for all to authenticated using (true) with check (true);

-- Policies for customers
create policy "Allow public insert for customers" on public.customers
    for insert with check (true);

create policy "Allow authenticated admin full access to customers" on public.customers
    for all to authenticated using (true) with check (true);

-- Policies for orders
create policy "Allow public insert for orders" on public.orders
    for insert with check (true);

create policy "Allow authenticated admin full access to orders" on public.orders
    for all to authenticated using (true) with check (true);

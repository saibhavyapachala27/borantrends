-- Seed Active Branches (Excluding Malkajgiri and Uppal)
insert into public.branches (id, name, whatsapp_number, is_active) values
('b1000000-0000-0000-0000-000000000001', 'Bhongir', '+919876543210', true),
('b1000000-0000-0000-0000-000000000002', 'Mothkur', '+918765432109', true),
('b1000000-0000-0000-0000-000000000003', 'Jangaon', '+917654321098', true);

-- Seed Products
insert into public.products (id, name, description, price, category, sizes, image_urls, is_enabled) values
(
    'p1000000-0000-0000-0000-000000000001',
    'Essential Crew — Onyx',
    'Premium heavy-knit cotton t-shirt with flatlock seams and standard boxy fit.',
    799.00,
    'T-Shirts',
    array['S', 'M', 'L', 'XL'],
    array['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000002',
    'Pearl White Formal Shirt',
    'Crisp, single-needle stitched formal button-up crafted from premium long-staple cotton.',
    1499.00,
    'Formal Shirts',
    array['M', 'L', 'XL', 'XXL'],
    array['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1621072156002-e2fcc40d1759?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000003',
    'Premium Cotton — Bone',
    'Soft organic cotton crewneck tee in a sophisticated muted off-white tone.',
    899.00,
    'T-Shirts',
    array['S', 'M', 'L', 'XL'],
    array['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000004',
    'Down Shoulder Noir Tee',
    'Cinematic streetwear aesthetics with an oversized drape and drop-shoulder sleeve tailoring.',
    999.00,
    'Down Shoulder',
    array['M', 'L', 'XL'],
    array['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000005',
    'Baggy Relaxed Jeans — Vintage Blue',
    'Thick Japanese selvedge denim in a relaxed fit with fading detail along the seams.',
    1899.00,
    'Baggy Jeans',
    array['S', 'M', 'L', 'XL', 'XXL'],
    array['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000006',
    'Classic Slim Fit Khakis',
    'Flat-front formal trousers tailored from stretch cotton twill for comfort and crisp look.',
    1299.00,
    'Formal Pants',
    array['M', 'L', 'XL'],
    array['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000007',
    'Linen Breeze Shirt — Pastel Pink',
    'Relaxed luxury shirt woven in pure French linen, highly breathable for Indian summers.',
    1599.00,
    'Linen Edit',
    array['S', 'M', 'L', 'XL'],
    array['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop'],
    true
),
(
    'p1000000-0000-0000-0000-000000000008',
    'Formal Baggies Pleated',
    'Luxurious high-waisted pleated trousers styled for sharp, retro-modern silhouettes.',
    2199.00,
    'Formal Baggies',
    array['M', 'L', 'XL', 'XXL'],
    array['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop'],
    true
);

-- Seed Inventory levels across active branches (Bhongir, Mothkur, Jangaon)
insert into public.inventory (branch_id, product_id, quantity, price_override) values
-- Bhongir (b1)
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 30, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', 15, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000003', 25, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000004', 0, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000005', 40, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000006', 20, 1199.00),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000007', 12, null),
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000008', 5, null),

-- Mothkur (b2)
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 20, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 10, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000003', 15, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000004', 8, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000005', 0, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000006', 15, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000007', 8, null),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000008', 3, null),

-- Jangaon (b3)
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 5, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000002', 30, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 10, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', 12, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000005', 20, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000006', 0, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000007', 5, null),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000008', 15, null);

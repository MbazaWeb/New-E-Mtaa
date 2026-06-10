-- 19_seed_data.sql
-- Default seed data: 9 core services
INSERT INTO service_catalog (service_code, service_name, service_name_sw, category, form_fields, fee_amount)
VALUES
('RES-LETTER', 'Certificate of Residency', 'Cheti cha Makazi', 'CITIZEN_DOCUMENTS', '[]', 0),
('BURIAL-PERMIT', 'Burial Permit', 'Ruhusa ya Kuzika', 'CITIZEN_DOCUMENTS', '[]', 5000),
('EVENT-PERMIT', 'Event Permit', 'Ruhusa ya Tukio', 'CITIZEN_DOCUMENTS', '[]', 10000),
('CONST-PERMIT', 'Minor Construction Permit', 'Ruhusa ya Ujenzi Mdogo', 'PROPERTY_SERVICES', '[]', 25000),
('INTRO-LETTER', 'Introduction Letter', 'Barua ya Utangulizi', 'CITIZEN_DOCUMENTS', '[]', 0),
('SALES-AGREE', 'Sales Agreement', 'Mkataba wa Mauzo', 'BUSINESS_SERVICES', '[]', 15000),
('RENTAL-AGREE', 'Rental Agreement', 'Mkataba wa Kukodisha', 'BUSINESS_SERVICES', '[]', 10000),
('DISPUTE-RES', 'Dispute Resolution', 'Utatuzi wa Migogoro', 'COMPLAINTS', '[]', 0),
('PAYMENT-REC', 'Payments & Contributions', 'Malipo na Michango', 'COMMUNITY_SERVICES', '[]', 0)
ON CONFLICT (service_code) DO NOTHING;

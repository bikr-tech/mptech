-- Run this in Supabase Dashboard SQL Editor to allow new section types
ALTER TABLE landing_sections
DROP CONSTRAINT IF EXISTS landing_sections_type_check;

ALTER TABLE landing_sections
ADD CONSTRAINT landing_sections_type_check
CHECK (type IN (
  'hero_3d', 'emergency_call', 'services_grid', 'reviews',
  'project_gallery', 'site_footer', 'plumbing_tool_3d',
  'ai_diagnosis', 'trust_banner', 'plumbers_match',
  'map_section', 'app_section', 'faq_section', 'final_cta'
));

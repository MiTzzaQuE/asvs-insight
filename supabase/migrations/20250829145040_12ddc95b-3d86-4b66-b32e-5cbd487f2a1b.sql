-- Fix security definer views by dropping with cascade and recreating
DROP VIEW IF EXISTS public.overall_stats CASCADE;
DROP VIEW IF EXISTS public.section_stats CASCADE;

-- Create section stats view (without security definer)
CREATE VIEW public.section_stats AS
SELECT 
  s.id as section_id,
  s.name as section_name,
  s.slug as section_slug,
  s.order_index,
  COUNT(CASE WHEN r.status = 'Valid' THEN 1 END) as valid_count,
  COUNT(CASE WHEN r.status IN ('Valid', 'Non-valid') THEN 1 END) as total_count,
  CASE 
    WHEN COUNT(CASE WHEN r.status IN ('Valid', 'Non-valid') THEN 1 END) = 0 THEN 0
    ELSE ROUND(
      (COUNT(CASE WHEN r.status = 'Valid' THEN 1 END) * 100.0) / 
      NULLIF(COUNT(CASE WHEN r.status IN ('Valid', 'Non-valid') THEN 1 END), 0), 
      1
    )
  END as validity_percentage
FROM public.sections s
LEFT JOIN public.requirements r ON s.id = r.section_id
GROUP BY s.id, s.name, s.slug, s.order_index
ORDER BY s.order_index;

-- Create overall stats view (without security definer)
CREATE VIEW public.overall_stats AS
SELECT 
  SUM(valid_count) as valid_sum,
  SUM(total_count) as total_sum,
  CASE 
    WHEN SUM(total_count) = 0 THEN 0
    ELSE ROUND((SUM(valid_count) * 100.0) / NULLIF(SUM(total_count), 0), 1)
  END as overall_validity_percentage,
  'L1'::TEXT as asvs_level_acquired
FROM public.section_stats;
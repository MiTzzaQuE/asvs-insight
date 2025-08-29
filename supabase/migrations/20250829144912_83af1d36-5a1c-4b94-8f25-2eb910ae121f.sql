-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create status enum for requirements
CREATE TYPE public.requirement_status AS ENUM ('Valid', 'Non-valid', 'Not Applicable', 'Unanswered');

-- Create requirements table
CREATE TABLE public.requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  area TEXT,
  section_code TEXT,
  asvs_level TEXT,
  cwe TEXT,
  nist TEXT,
  verification_requirement TEXT,
  status requirement_status NOT NULL DEFAULT 'Unanswered',
  source_code_reference TEXT,
  comment TEXT,
  tool_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for sections (read-only for authenticated users)
CREATE POLICY "Sections are viewable by authenticated users" 
ON public.sections 
FOR SELECT 
TO authenticated
USING (true);

-- Create policies for requirements
CREATE POLICY "Requirements are viewable by authenticated users" 
ON public.requirements 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert requirements" 
ON public.requirements 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update requirements" 
ON public.requirements 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete requirements" 
ON public.requirements 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at
  BEFORE UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for section stats
CREATE OR REPLACE VIEW public.section_stats AS
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

-- Create view for overall stats
CREATE OR REPLACE VIEW public.overall_stats AS
SELECT 
  SUM(valid_count) as valid_sum,
  SUM(total_count) as total_sum,
  CASE 
    WHEN SUM(total_count) = 0 THEN 0
    ELSE ROUND((SUM(valid_count) * 100.0) / NULLIF(SUM(total_count), 0), 1)
  END as overall_validity_percentage,
  'L1'::TEXT as asvs_level_acquired
FROM public.section_stats;

-- Insert the 14 sections
INSERT INTO public.sections (name, slug, order_index) VALUES
  ('Architecture', 'architecture', 1),
  ('Authentication', 'authentication', 2),
  ('Session Management', 'session-management', 3),
  ('Access Control', 'access-control', 4),
  ('Input Validation', 'input-validation', 5),
  ('Cryptography at Rest', 'cryptography-at-rest', 6),
  ('Error Handling and Logging', 'error-handling-and-logging', 7),
  ('Data Protection', 'data-protection', 8),
  ('Communication Security', 'communication-security', 9),
  ('Malicious Code', 'malicious-code', 10),
  ('Business Logic', 'business-logic', 11),
  ('Files and Resources', 'files-and-resources', 12),
  ('API and Web Service', 'api-and-web-service', 13),
  ('Configuration', 'configuration', 14);

-- Insert sample requirements for testing (few per section)
INSERT INTO public.requirements (section_id, area, section_code, asvs_level, cwe, nist, verification_requirement) VALUES
  ((SELECT id FROM public.sections WHERE slug = 'architecture'), 'Architecture', '1.1.1', '1', 'CWE-1', 'NIST-1', 'Verify the use of a secure software development lifecycle that addresses security in all stages of development.'),
  ((SELECT id FROM public.sections WHERE slug = 'architecture'), 'Architecture', '1.1.2', '1', 'CWE-2', 'NIST-2', 'Verify the use of threat modeling for every design change or sprint planning to identify threats, plan for countermeasures, facilitate appropriate risk responses, and guide security testing.'),
  ((SELECT id FROM public.sections WHERE slug = 'authentication'), 'Authentication', '2.1.1', '1', 'CWE-307', 'NIST-3', 'Verify that user set passwords are at least 12 characters in length (after multiple spaces are combined).'),
  ((SELECT id FROM public.sections WHERE slug = 'authentication'), 'Authentication', '2.1.2', '1', 'CWE-521', 'NIST-4', 'Verify that passwords of at least 64 characters are permitted, and that passwords of more than 128 characters are denied.'),
  ((SELECT id FROM public.sections WHERE slug = 'session-management'), 'Session Management', '3.1.1', '1', 'CWE-384', 'NIST-5', 'Verify that the application never reveals session tokens in URL parameters.'),
  ((SELECT id FROM public.sections WHERE slug = 'access-control'), 'Access Control', '4.1.1', '1', 'CWE-22', 'NIST-6', 'Verify that the application enforces access control rules on a trusted service layer, especially if client-side access control is present and could be bypassed.');
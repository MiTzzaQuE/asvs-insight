import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OverallStats {
  valid_sum: number;
  total_sum: number;
  overall_validity_percentage: number;
  asvs_level_acquired: string;
}

interface SectionStats {
  section_name: string;
  section_slug: string;
  valid_count: number;
  total_count: number;
  validity_percentage: number;
}

export function useSupabaseData() {
  const { user } = useAuth();
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch overall stats
      const { data: overallData, error: overallError } = await supabase
        .from('overall_stats')
        .select('*')
        .maybeSingle();

      if (overallError && overallError.code !== 'PGRST116') {
        throw overallError;
      }

      // Fetch section stats
      const { data: sectionData, error: sectionError } = await supabase
        .from('section_stats')
        .select('*')
        .order('order_index');

      if (sectionError) throw sectionError;

      setOverallStats(overallData || {
        valid_sum: 0,
        total_sum: 0,
        overall_validity_percentage: 0,
        asvs_level_acquired: 'L1'
      });
      
      setSectionStats(sectionData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      
      // Set fallback data
      setOverallStats({
        valid_sum: 0,
        total_sum: 0,
        overall_validity_percentage: 0,
        asvs_level_acquired: 'L1'
      });
      setSectionStats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    overallStats,
    sectionStats,
    loading,
    error,
    refetch: fetchData
  };
}
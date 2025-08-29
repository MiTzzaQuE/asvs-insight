import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Requirement {
  id: string;
  verification_requirement: string;
  status: 'Valid' | 'Non-valid' | 'Not Applicable' | 'Unanswered';
  comment: string | null;
  tool_used: string | null;
  source_code_reference: string | null;
  asvs_level: string | null;
  nist: string | null;
  cwe: string | null;
  section_code: string | null;
  area: string | null;
}

interface Section {
  id: string;
  name: string;
  slug: string;
}

const SectionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<Section | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (user && slug) {
      fetchSectionData();
    }
  }, [user, slug]);

  const fetchSectionData = async () => {
    try {
      // Fetch section
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .eq('slug', slug)
        .single();

      if (sectionError) throw sectionError;
      setSection(sectionData);

      // Fetch requirements for this section
      const { data: requirementsData, error: requirementsError } = await supabase
        .from('requirements')
        .select('*')
        .eq('section_id', sectionData.id)
        .eq('user_id', user!.id)
        .order('created_at');

      if (requirementsError) throw requirementsError;
      setRequirements(requirementsData || []);
    } catch (error) {
      console.error('Error fetching section data:', error);
      toast({
        title: "Error",
        description: "Failed to load section data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequirement = async (requirementId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('requirements')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', requirementId)
        .eq('user_id', user!.id);

      if (error) throw error;

      setRequirements(prev => 
        prev.map(req => 
          req.id === requirementId 
            ? { ...req, [field]: value }
            : req
        )
      );

      toast({
        title: "Updated",
        description: "Requirement updated successfully",
      });
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast({
        title: "Error",
        description: "Failed to update requirement",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Valid': return 'default';
      case 'Non-valid': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredRequirements = requirements.filter(req =>
    req.verification_requirement?.toLowerCase().includes(searchValue.toLowerCase()) ||
    req.comment?.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader showSearch={false} />
          <main className="flex-1 p-6 bg-muted/20">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader showSearch={false} />
          <main className="flex-1 p-6 bg-muted/20">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Section Not Found</h1>
              <p className="text-muted-foreground mt-2">The requested security section could not be found.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <AppHeader 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 p-6 bg-muted/20">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{section.name} Security Requirements</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track verification status for {section.name.toLowerCase()} requirements
              </p>
            </div>

            {filteredRequirements.length === 0 ? (
              <Card className="bg-card">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    {requirements.length === 0 
                      ? "No requirements found for this section yet." 
                      : "No requirements match your search criteria."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRequirements.map((requirement) => (
                  <Card key={requirement.id} className="bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex-1">{requirement.verification_requirement}</span>
                        <Badge variant={getStatusVariant(requirement.status)}>
                          {requirement.status}
                        </Badge>
                      </CardTitle>
                      {(requirement.section_code || requirement.area || requirement.asvs_level || requirement.nist || requirement.cwe) && (
                        <CardDescription className="flex gap-2 flex-wrap">
                          {requirement.section_code && (
                            <Badge variant="outline">Section: {requirement.section_code}</Badge>
                          )}
                          {requirement.area && (
                            <Badge variant="outline">Area: {requirement.area}</Badge>
                          )}
                          {requirement.asvs_level && (
                            <Badge variant="outline">ASVS: {requirement.asvs_level}</Badge>
                          )}
                          {requirement.nist && (
                            <Badge variant="outline">NIST: {requirement.nist}</Badge>
                          )}
                          {requirement.cwe && (
                            <Badge variant="outline">CWE: {requirement.cwe}</Badge>
                          )}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <Select 
                            value={requirement.status} 
                            onValueChange={(value) => updateRequirement(requirement.id, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Valid">Valid</SelectItem>
                              <SelectItem value="Non-valid">Non-valid</SelectItem>
                              <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                              <SelectItem value="Unanswered">Unanswered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tool Used</label>
                          <Textarea
                            placeholder="Tool or method used for verification..."
                            value={requirement.tool_used || ''}
                            onChange={(e) => updateRequirement(requirement.id, 'tool_used', e.target.value)}
                            className="min-h-[40px]"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Source Code Reference</label>
                        <Textarea
                          placeholder="Reference to source code, files, or documentation..."
                          value={requirement.source_code_reference || ''}
                          onChange={(e) => updateRequirement(requirement.id, 'source_code_reference', e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Comments</label>
                        <Textarea
                          placeholder="Additional notes or comments about this requirement..."
                          value={requirement.comment || ''}
                          onChange={(e) => updateRequirement(requirement.id, 'comment', e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SectionDetail;
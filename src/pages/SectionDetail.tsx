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
import { Save } from 'lucide-react';

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
  // Track local changes for each requirement
  const [localChanges, setLocalChanges] = useState<{[key: string]: {[field: string]: string}}>({});
  const [savingFields, setSavingFields] = useState<{[key: string]: boolean}>({});

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

  // Handle local changes for text fields
  const handleTextChange = (requirementId: string, field: string, value: string) => {
    setLocalChanges(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        [field]: value
      }
    }));
  };

  // Save changes for a specific field
  const saveTextChanges = async (requirementId: string, field: string) => {
    const value = localChanges[requirementId]?.[field];
    if (value === undefined) return;

    const fieldKey = `${requirementId}-${field}`;
    setSavingFields(prev => ({ ...prev, [fieldKey]: true }));

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

      // Clear local changes for this field
      setLocalChanges(prev => {
        const newChanges = { ...prev };
        if (newChanges[requirementId]) {
          delete newChanges[requirementId][field];
          if (Object.keys(newChanges[requirementId]).length === 0) {
            delete newChanges[requirementId];
          }
        }
        return newChanges;
      });

      toast({
        title: "Saved",
        description: "Changes saved successfully",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setSavingFields(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  // Get the current value for a field (local changes or original value)
  const getFieldValue = (requirement: Requirement, field: keyof Requirement) => {
    return localChanges[requirement.id]?.[field as string] ?? (requirement[field] || '');
  };

  // Check if there are unsaved changes for a field
  const hasUnsavedChanges = (requirementId: string, field: string) => {
    return localChanges[requirementId]?.[field] !== undefined;
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
                      {(requirement.asvs_level || requirement.section_code || requirement.area || requirement.nist || requirement.cwe) && (
                        <CardDescription className="flex gap-2 flex-wrap">
                          {requirement.asvs_level && (
                            <Badge variant="outline">ASVS: {requirement.asvs_level}</Badge>
                          )}
                          {requirement.section_code && (
                            <Badge variant="outline">Section: {requirement.section_code}</Badge>
                          )}
                          {requirement.area && (
                            <Badge variant="outline">Area: {requirement.area}</Badge>
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
                          <label className="text-sm font-medium mb-2 block">
                            Tool Used
                            {hasUnsavedChanges(requirement.id, 'tool_used') && (
                              <span className="text-amber-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Tool or method used for verification..."
                              value={getFieldValue(requirement, 'tool_used')}
                              onChange={(e) => handleTextChange(requirement.id, 'tool_used', e.target.value)}
                              onBlur={() => saveTextChanges(requirement.id, 'tool_used')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  saveTextChanges(requirement.id, 'tool_used');
                                }
                              }}
                              className="min-h-[40px] flex-1"
                            />
                            {hasUnsavedChanges(requirement.id, 'tool_used') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveTextChanges(requirement.id, 'tool_used')}
                                disabled={savingFields[`${requirement.id}-tool_used`]}
                                className="px-2"
                              >
                                {savingFields[`${requirement.id}-tool_used`] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Source Code Reference
                          {hasUnsavedChanges(requirement.id, 'source_code_reference') && (
                            <span className="text-amber-500 ml-1">*</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Reference to source code, files, or documentation..."
                            value={getFieldValue(requirement, 'source_code_reference')}
                            onChange={(e) => handleTextChange(requirement.id, 'source_code_reference', e.target.value)}
                            onBlur={() => saveTextChanges(requirement.id, 'source_code_reference')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveTextChanges(requirement.id, 'source_code_reference');
                              }
                            }}
                            className="min-h-[60px] flex-1"
                          />
                          {hasUnsavedChanges(requirement.id, 'source_code_reference') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveTextChanges(requirement.id, 'source_code_reference')}
                              disabled={savingFields[`${requirement.id}-source_code_reference`]}
                              className="px-2 self-start"
                            >
                              {savingFields[`${requirement.id}-source_code_reference`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Comments
                          {hasUnsavedChanges(requirement.id, 'comment') && (
                            <span className="text-amber-500 ml-1">*</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Additional notes or comments about this requirement..."
                            value={getFieldValue(requirement, 'comment')}
                            onChange={(e) => handleTextChange(requirement.id, 'comment', e.target.value)}
                            onBlur={() => saveTextChanges(requirement.id, 'comment')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveTextChanges(requirement.id, 'comment');
                              }
                            }}
                            className="min-h-[80px] flex-1"
                          />
                          {hasUnsavedChanges(requirement.id, 'comment') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveTextChanges(requirement.id, 'comment')}
                              disabled={savingFields[`${requirement.id}-comment`]}
                              className="px-2 self-start"
                            >
                              {savingFields[`${requirement.id}-comment`] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
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
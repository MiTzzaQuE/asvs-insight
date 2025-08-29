import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Section {
  id: string;
  name: string;
  slug: string;
  order_index: number;
}

interface RequirementTemplate {
  id?: string;
  verification_requirement: string;
  asvs_level: string;
  section_code: string;
  area: string;
  nist?: string;
  cwe?: string;
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [requirements, setRequirements] = useState<RequirementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSection) {
      fetchRequirements();
    }
  }, [selectedSection]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "Error",
        description: "Failed to load sections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    if (!selectedSection) return;

    try {
      const { data, error } = await supabase
        .from('requirements')
        .select('id, verification_requirement, asvs_level, section_code, area, nist, cwe')
        .eq('section_id', selectedSection)
        .eq('user_id', user!.id)
        .order('created_at');

      if (error) throw error;
      setRequirements(data || []);
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast({
        title: "Error",
        description: "Failed to load requirements",
        variant: "destructive",
      });
    }
  };

  const addRequirement = () => {
    setRequirements(prev => [...prev, {
      verification_requirement: '',
      asvs_level: 'L1',
      section_code: '',
      area: '',
      nist: '',
      cwe: ''
    }]);
  };

  const updateRequirement = (index: number, field: string, value: string) => {
    setRequirements(prev => 
      prev.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    );
  };

  const removeRequirement = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const saveRequirements = async () => {
    if (!selectedSection) {
      toast({
        title: "Error",
        description: "Please select a section first",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Delete existing requirements for this section and user
      await supabase
        .from('requirements')
        .delete()
        .eq('section_id', selectedSection)
        .eq('user_id', user!.id);

      // Insert new requirements
      const requirementsToInsert = requirements.map(req => ({
        ...req,
        section_id: selectedSection,
        user_id: user!.id,
        status: 'Unanswered' as const
      }));

      const { error } = await supabase
        .from('requirements')
        .insert(requirementsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Requirements saved successfully",
      });

      fetchRequirements();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: "Error",
        description: "Failed to save requirements",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadSampleRequirements = () => {
    const sampleRequirements: RequirementTemplate[] = [
      {
        verification_requirement: "Verify that secure architecture design is considered and implemented consistently across all components and services.",
        asvs_level: "L1",
        section_code: "1.1.1",
        area: "Architecture",
        nist: "SA-8",
        cwe: "CWE-1008"
      },
      {
        verification_requirement: "Verify that all components are up to date and supported by the vendor with security patches available.",
        asvs_level: "L1", 
        section_code: "1.1.2",
        area: "Architecture",
        nist: "SA-22",
        cwe: "CWE-1104"
      }
    ];

    setRequirements(sampleRequirements);
    toast({
      title: "Sample Data Loaded",
      description: "Sample requirements have been loaded for testing",
    });
  };

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

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        <AppHeader showSearch={false} />
        
        <main className="flex-1 p-6 bg-muted/20">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage security requirements and sections
              </p>
            </div>

            {/* Section Selection */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Select Security Section</CardTitle>
                <CardDescription>
                  Choose a section to manage its requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a security section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Requirements Management */}
            {selectedSection && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Requirements Management
                    <div className="flex gap-2">
                      <Button onClick={loadSampleRequirements} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load Sample
                      </Button>
                      <Button onClick={addRequirement} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Define verification requirements for the selected section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requirements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No requirements defined yet. Click "Add Requirement" to get started.
                    </div>
                  ) : (
                    requirements.map((requirement, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">Requirement {index + 1}</Badge>
                          <Button
                            onClick={() => removeRequirement(index)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Verification Requirement *
                            </label>
                            <Textarea
                              placeholder="Describe what needs to be verified..."
                              value={requirement.verification_requirement}
                              onChange={(e) => updateRequirement(index, 'verification_requirement', e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">ASVS Level</label>
                              <Select 
                                value={requirement.asvs_level} 
                                onValueChange={(value) => updateRequirement(index, 'asvs_level', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="L1">L1</SelectItem>
                                  <SelectItem value="L2">L2</SelectItem>
                                  <SelectItem value="L3">L3</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-1 block">Section Code</label>
                              <Input
                                placeholder="e.g., 1.1.1"
                                value={requirement.section_code}
                                onChange={(e) => updateRequirement(index, 'section_code', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-1 block">Area</label>
                              <Input
                                placeholder="e.g., Architecture"
                                value={requirement.area}
                                onChange={(e) => updateRequirement(index, 'area', e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">NIST Reference</label>
                              <Input
                                placeholder="e.g., SA-8"
                                value={requirement.nist || ''}
                                onChange={(e) => updateRequirement(index, 'nist', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium mb-1 block">CWE Reference</label>
                              <Input
                                placeholder="e.g., CWE-1008"
                                value={requirement.cwe || ''}
                                onChange={(e) => updateRequirement(index, 'cwe', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {requirements.length > 0 && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={saveRequirements} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Requirements'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
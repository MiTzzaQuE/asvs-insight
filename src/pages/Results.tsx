import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface SectionStat {
  section_name: string;
  section_slug: string;
  valid_count: number;
  total_count: number;
  validity_percentage: number;
}

interface OverallStat {
  valid_sum: number;
  total_sum: number;
  overall_validity_percentage: number;
  asvs_level_acquired: string;
}

const Results = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sectionStats, setSectionStats] = useState<SectionStat[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user]);

  const fetchResults = async () => {
    try {
      // Fetch section stats
      const { data: sectionData, error: sectionError } = await supabase
        .from('section_stats')
        .select('*')
        .order('order_index');

      if (sectionError) throw sectionError;
      setSectionStats(sectionData || []);

      // Fetch overall stats
      const { data: overallData, error: overallError } = await supabase
        .from('overall_stats')
        .select('*')
        .single();

      if (overallError) throw overallError;
      setOverallStats(overallData);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load results data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 50) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusVariant = (percentage: number): 'default' | 'secondary' | 'destructive' => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  const exportResults = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Creating your results report...",
      });

      // Get the main content area
      const element = document.querySelector('main');
      if (!element) {
        throw new Error('Could not find content to export');
      }

      // Create canvas from the content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const imgData = canvas.toDataURL('image/png');
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `asvs-l1-results-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Exported",
        description: "Results exported successfully as PDF",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export results as PDF",
        variant: "destructive",
      });
    }
  };

  const filteredSections = sectionStats.filter(section =>
    section.section_name.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader showSearch={false} />
          <main className="flex-1 p-6 bg-muted/20" id="results-content">
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
        <AppHeader 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 p-6 bg-muted/20" id="results-content">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Security Assessment Results</h1>
                <p className="text-muted-foreground mt-2">
                  Comprehensive view of your ASVS L1 compliance status
                </p>
              </div>
              
              <Button onClick={exportResults} className="gap-2">
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            </div>

            {/* Overall Results Card */}
            {overallStats && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Overall Assessment Results
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {overallStats.asvs_level_acquired}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete security verification status across all categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {overallStats.valid_sum}
                      </div>
                      <p className="text-sm text-muted-foreground">Valid Requirements</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {overallStats.overall_validity_percentage.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Compliance</p>
                      <Progress 
                        value={overallStats.overall_validity_percentage} 
                        className="h-2 mt-2"
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-muted-foreground">
                        {overallStats.total_sum}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Requirements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Section Results */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Section-by-Section Results</h2>
              
              {filteredSections.length === 0 ? (
                <Card className="bg-card">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {sectionStats.length === 0 
                        ? "No assessment data available yet." 
                        : "No sections match your search criteria."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSections.map((section) => (
                    <Card key={section.section_slug} className="bg-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {getStatusIcon(section.validity_percentage)}
                            {section.section_name}
                          </span>
                          <Badge variant={getStatusVariant(section.validity_percentage)}>
                            {section.validity_percentage.toFixed(1)}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Progress 
                          value={section.validity_percentage} 
                          className="h-2"
                        />
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">
                              {section.valid_count}
                            </div>
                            <div className="text-muted-foreground">Valid</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">
                              {section.total_count}
                            </div>
                            <div className="text-muted-foreground">Total</div>
                          </div>
                        </div>
                        
                        {section.total_count === 0 && (
                          <p className="text-xs text-muted-foreground italic text-center">
                            No assessed items yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {overallStats && overallStats.overall_validity_percentage < 100 && (
              <Card className="bg-card border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    Improvement Recommendations
                  </CardTitle>
                  <CardDescription>
                    Focus areas to improve your security posture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {filteredSections
                      .filter(section => section.validity_percentage < 80)
                      .slice(0, 3)
                      .map((section) => (
                        <li key={section.section_slug} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Review and address gaps in <strong>{section.section_name}</strong> 
                          ({section.validity_percentage.toFixed(1)}% complete)
                        </li>
                      ))}
                    {overallStats.valid_sum === 0 && (
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                        Start by assessing requirements in key security areas
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;
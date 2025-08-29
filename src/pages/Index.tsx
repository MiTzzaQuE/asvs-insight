import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const Index = () => {
  const [searchValue, setSearchValue] = useState('');
  const { overallStats, sectionStats, loading } = useSupabaseData();

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusVariant = (percentage: number): 'default' | 'secondary' | 'destructive' => {
    if (percentage >= 80) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
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
        <AppHeader 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 p-6 bg-muted/20">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">ASVS L1 Security Verification Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Track your security verification progress across all categories
              </p>
            </div>

            {/* Overall Stats Card */}
            {overallStats && (
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Overall Progress
                    <Badge variant="outline">{overallStats.asvs_level_acquired}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Complete security verification status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Valid Criteria: {overallStats.valid_sum}</span>
                      <span>Total Criteria: {overallStats.total_sum}</span>
                    </div>
                    <Progress 
                      value={overallStats.overall_validity_percentage} 
                      className="h-3"
                    />
                    <div className="text-center">
                      <span className="text-2xl font-bold">
                        {overallStats.overall_validity_percentage.toFixed(1)}%
                      </span>
                      <p className="text-sm text-muted-foreground">Validity Percentage</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Stats Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Security Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionStats.map((section) => (
                  <Card key={section.section_name} className="bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {section.section_name}
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
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Valid: {section.valid_count}</span>
                        <span>Total: {section.total_count}</span>
                      </div>
                      {section.total_count === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No assessed items yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;

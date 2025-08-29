import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const Index = () => {
  const [searchValue, setSearchValue] = useState('');

  // Mock data for now - will be fetched from Supabase later
  const overallStats = {
    validSum: 12,
    totalSum: 48,
    overallValidityPercentage: 25.0,
    asvsLevelAcquired: 'L1'
  };

  const sectionStats = [
    { sectionName: 'Architecture', validCount: 2, totalCount: 2, validityPercentage: 100.0 },
    { sectionName: 'Authentication', validCount: 1, totalCount: 2, validityPercentage: 50.0 },
    { sectionName: 'Session Management', validCount: 0, totalCount: 1, validityPercentage: 0.0 },
    { sectionName: 'Access Control', validCount: 1, totalCount: 1, validityPercentage: 100.0 },
    // ... other sections would have 0 valid, 0 total for now
  ];

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
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Overall Progress
                  <Badge variant="outline">{overallStats.asvsLevelAcquired}</Badge>
                </CardTitle>
                <CardDescription>
                  Complete security verification status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Valid Criteria: {overallStats.validSum}</span>
                    <span>Total Criteria: {overallStats.totalSum}</span>
                  </div>
                  <Progress 
                    value={overallStats.overallValidityPercentage} 
                    className="h-3"
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold">
                      {overallStats.overallValidityPercentage}%
                    </span>
                    <p className="text-sm text-muted-foreground">Validity Percentage</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Stats Grid */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Security Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionStats.map((section) => (
                  <Card key={section.sectionName} className="bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {section.sectionName}
                        <Badge variant={getStatusVariant(section.validityPercentage)}>
                          {section.validityPercentage}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress 
                        value={section.validityPercentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Valid: {section.validCount}</span>
                        <span>Total: {section.totalCount}</span>
                      </div>
                      {section.totalCount === 0 && (
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

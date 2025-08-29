import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  id: string;
  verification_requirement: string;
  section_code: string;
  cwe: string;
  section_id: string;
  section_name: string;
  section_slug: string;
}

interface SearchResultsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function SearchResults({ searchValue, onSearchChange }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const searchRequirements = async () => {
      if (!searchValue.trim() || searchValue.length < 2 || !user) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('requirements')
          .select(`
            id,
            verification_requirement,
            section_code,
            cwe,
            section_id,
            sections!inner(name, slug)
          `)
          .eq('user_id', user.id)
          .or(`verification_requirement.ilike.%${searchValue}%,section_code.ilike.%${searchValue}%,cwe.ilike.%${searchValue}%`)
          .limit(10);

        if (error) throw error;

        const formattedResults = data?.map(item => ({
          id: item.id,
          verification_requirement: item.verification_requirement || '',
          section_code: item.section_code || '',
          cwe: item.cwe || '',
          section_id: item.section_id,
          section_name: (item.sections as any)?.name || '',
          section_slug: (item.sections as any)?.slug || ''
        })) || [];

        setResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchRequirements, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue, user]);

  const handleResultClick = (result: SearchResult) => {
    navigate(`/section/${result.section_slug}`);
    setOpen(false);
    onSearchChange('');
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Popover open={open && searchValue.length >= 2} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search requirements..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-popover border shadow-lg" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <Command>
          <CommandList>
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty className="p-4 text-sm text-muted-foreground text-center">
                {searchValue.length < 2 ? 'Type at least 2 characters to search' : 'No requirements found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Requirements">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    className="p-3 cursor-pointer hover:bg-accent/50 border-b border-border/50 last:border-b-0"
                    onSelect={() => handleResultClick(result)}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {truncateText(result.verification_requirement, 80)}
                        </p>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {result.section_name}
                        </Badge>
                        {result.section_code && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {result.section_code}
                          </Badge>
                        )}
                        {result.cwe && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {result.cwe}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
}

interface MenuFiltersProps {
  businessId: string;
  onFilterChange: (filters: {
    search: string;
    categoryId: string | null;
  }) => void;
}

export const MenuFilters = ({ businessId, onFilterChange }: MenuFiltersProps) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, [businessId]);

  useEffect(() => {
    onFilterChange({
      search,
      categoryId: selectedCategory
    });
  }, [search, selectedCategory, onFilterChange]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('active', true)
        .order('name');

      if (data) setCategories(data);
      if (error) console.error('Erro ao buscar categorias:', error);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
  };

  const hasActiveFilters = search.length > 0 || selectedCategory !== null;

  return (
    <div className="space-y-4 mb-6">
      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filtro por categorias */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={`h-8 ${selectedCategory === null ? '' : 'hover:bg-primary hover:text-primary-foreground'}`}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`h-8 ${selectedCategory === category.id ? '' : 'hover:bg-primary hover:text-primary-foreground'}`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Botão para limpar filtros */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Filtros ativos:</span>
                {search && (
                  <Badge variant="secondary" className="text-xs">
                    "{search}"
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
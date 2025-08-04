import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
  active: boolean;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar o business_id do usuário
      const { data: businessData, error: businessError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .single();

      if (businessError) throw businessError;
      if (!businessData) throw new Error('Negócio não encontrado');

      const categoryData = {
        name: formData.name,
        description: formData.description,
        display_order: parseInt(formData.display_order) || 0,
        business_id: businessData.id
      };

      let result;
      if (editingCategory) {
        result = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
      } else {
        result = await supabase
          .from('menu_categories')
          .insert([categoryData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso!",
        description: editingCategory ? "Categoria atualizada" : "Categoria criada"
      });

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', display_order: '' });
      fetchCategories();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order?.toString() || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os itens desta categoria ficarão sem categoria.')) return;

    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Categoria excluída"
      });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ active: !category.active })
        .eq('id', category.id);

      if (error) throw error;
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Categorias do Menu</CardTitle>
            <CardDescription>
              Organize seus itens em categorias para facilitar a navegação
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da categoria
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Categoria *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Pizzas, Bebidas, Sobremesas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva a categoria..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Criar')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id} className={!category.active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Ordem: {category.display_order}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      variant={category.active ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleActive(category)}
                    >
                      {category.active ? 'Ativa' : 'Inativa'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma categoria criada ainda</p>
              <p className="text-sm">Crie categorias para organizar melhor seus itens</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
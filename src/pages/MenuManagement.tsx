import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryManagement from '@/components/CategoryManagement';
import FlavorManagement from '@/components/FlavorManagement';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  active: boolean;
  category_id: string;
  preparation_time: number;
  supports_fractional?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const MenuManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
const [flavors, setFlavors] = useState<Array<{ id: string; name: string }>>([]);
const [selectedFlavorIds, setSelectedFlavorIds] = useState<string[]>([]);
const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    preparation_time: '',
    supports_fractional: false,
    image: null as File | null
  });

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchCategories();
      fetchFlavors();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const { data: business, error: bizError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (bizError) throw bizError;
      if (!business) throw new Error('Negócio não encontrado');

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', business.id)
        .order('name');

      if (error) throw error;
      if (data) setItems(data);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: business, error: bizError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (bizError) throw bizError;
      if (!business) throw new Error('Negócio não encontrado');

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('business_id', business.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchFlavors = async () => {
    try {
      const { data: business, error: bizError } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (bizError) throw bizError;
      if (!business) throw new Error('Negócio não encontrado');

      const { data, error } = await supabase
        .from('flavor_options')
        .select('id,name')
        .eq('business_id', business.id)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setFlavors((data || []) as any);
    } catch (error) {
      console.error('Erro ao buscar sabores:', error);
      setFlavors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let image_url = '';
      
      // Upload da imagem se houver
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        image_url = urlData.publicUrl;
      }

const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        preparation_time: parseInt(formData.preparation_time) || 0,
        supports_fractional: !!formData.supports_fractional,
        ...(image_url && { image_url })
      };

      let itemId: string | null = null;
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
        itemId = editingItem.id;
      } else {
        // Get business_id first
        const { data: businessData } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user?.id)
          .single();
        
        if (!businessData) throw new Error('Negócio não encontrado');
        
        const { data: inserted, error: insertError } = await supabase
          .from('menu_items')
          .insert([{ ...itemData, business_id: businessData.id }])
          .select('id')
          .single();
        if (insertError) throw insertError;
        itemId = inserted.id;
      }

      // Atualizar vínculo de sabores permitidos
      if (itemId) {
        // Limpa vínculos anteriores
        await supabase
          .from('menu_item_flavors')
          .delete()
          .eq('menu_item_id', itemId);

        if (formData.supports_fractional && selectedFlavorIds.length > 0) {
          const rows = selectedFlavorIds.map(fid => ({ menu_item_id: itemId!, flavor_id: fid }));
          const { error: linkError } = await supabase
            .from('menu_item_flavors')
            .insert(rows);
          if (linkError) throw linkError;
        }
      }

      toast({
        title: "Sucesso!",
        description: editingItem ? "Item atualizado" : "Item adicionado ao cardápio"
      });

      setDialogOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        preparation_time: '',
        supports_fractional: false,
        image: null
      });
      setSelectedFlavorIds([]);
      fetchItems();

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

  const handleEdit = async (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category_id: item.category_id || '',
      preparation_time: item.preparation_time?.toString() || '',
      supports_fractional: !!item.supports_fractional,
      image: null
    });

    try {
      // Carregar sabores vinculados ao item
      const { data } = await supabase
        .from('menu_item_flavors')
        .select('flavor_id')
        .eq('menu_item_id', item.id);
      setSelectedFlavorIds((data || []).map(r => r.flavor_id));
    } catch (e) {
      setSelectedFlavorIds([]);
    }

    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir item",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Item excluído do cardápio"
      });
      fetchItems();
    }
  };

  const toggleActive = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ active: !item.active })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    } else {
      fetchItems();
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Cardápio</h1>
        <p className="text-sm text-muted-foreground">
          Adicione e organize os itens do seu delivery
        </p>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
<TabsList>
          <TabsTrigger value="items">Itens do Menu</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="flavors">Sabores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="items">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Itens do Cardápio ({items.length})</h2>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Adicionar Item'}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do item do cardápio
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Item *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Pizza Margherita"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o item..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="25.90"
                    required
                  />
                </div>

              </div>

{categories.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="supports_fractional">Permitir meio a meio</Label>
                <Switch id="supports_fractional" checked={formData.supports_fractional} onCheckedChange={(v) => setFormData({ ...formData, supports_fractional: v })} />
              </div>
              {formData.supports_fractional && (
                <>
                  <p className="text-xs text-muted-foreground -mt-2 mb-2">Cadastre e ative os sabores na aba “Sabores”.</p>
                  <div className="space-y-2">
                    <Label>Sabores permitidos</Label>
                    <div className="max-h-48 overflow-auto rounded border p-2 space-y-2">
                      {flavors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum sabor ativo. Cadastre na aba “Sabores”.</p>
                      ) : (
                        flavors.map(f => (
                          <label key={f.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedFlavorIds.includes(f.id)}
                              onCheckedChange={(checked) => {
                                setSelectedFlavorIds(prev => checked ? [...prev, f.id] : prev.filter(id => id !== f.id));
                              }}
                            />
                            <span>{f.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Se não selecionar, todos os sabores ativos ficarão disponíveis.</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="image">Imagem</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({...formData, image: e.target.files?.[0] || null})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Adicionar')}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-[250px] object-cover rounded-md mb-3"
                />
              )}
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(item.price)}
                </span>
                <Button
                  variant={item.active ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleActive(item)}
                >
                  {item.active ? 'Ativo' : 'Inativo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhum item cadastrado ainda
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Item
            </Button>
          </div>
        )}
      </TabsContent>
      
<TabsContent value="categories">
        <CategoryManagement />
      </TabsContent>
      <TabsContent value="flavors">
        {/* Gerenciar sabores para pizzas meio a meio */}
        <FlavorManagement />
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default MenuManagement;
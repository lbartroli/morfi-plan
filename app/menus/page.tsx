'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ChefHat, Image as ImageIcon, Loader2, Search } from 'lucide-react';
import { jsonBinClient } from '@/lib/jsonbin';
import { Menu } from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { MenuEditDialog } from '@/components/MenuEditDialog';

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const data = await jsonBinClient.getData();
      setMenus(data.menus);
    } catch (_error) {
      toast.error('Error al cargar los menús');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (menuData: Omit<Menu, 'createdAt' | 'updatedAt'>) => {
    const fullMenuData: Menu = {
      ...menuData,
      createdAt: editingMenu?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If creating new menu (no editingMenu), generate new ID
    if (!editingMenu) {
      fullMenuData.id = uuidv4();
    }

    try {
      if (editingMenu) {
        await jsonBinClient.updateMenu(fullMenuData);
        toast.success('Menú actualizado correctamente');
      } else {
        await jsonBinClient.addMenu(fullMenuData);
        toast.success('Menú creado correctamente');
      }

      await loadMenus();
      setEditingMenu(null);
      setIsDialogOpen(false);
    } catch (_error) {
      toast.error('Error al guardar el menú');
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este menú?')) return;

    try {
      await jsonBinClient.deleteMenu(menuId);
      toast.success('Menú eliminado correctamente');
      await loadMenus();
    } catch (_error) {
      toast.error('Error al eliminar el menú');
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setIsDialogOpen(true);
  };

  const handleNewMenu = () => {
    setEditingMenu(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingMenu(null);
    setIsDialogOpen(false);
  };

  const filteredMenus = menus.filter(
    menu =>
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.ingredients.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Menús</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus recetas y menús favoritos</p>
        </div>

        <Button onClick={handleNewMenu}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Menú
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Buscar menús o ingredientes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal">
          <span className="font-semibold mr-1">{menus.length}</span>
          menús
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-normal">
          <span className="font-semibold mr-1">{menus.filter(m => m.image).length}</span>
          con imagen
        </Badge>
      </div>

      {/* Menu Grid */}
      {filteredMenus.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No se encontraron menús' : 'No hay menús aún'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Intenta con otros términos de búsqueda'
                : 'Comienza creando tu primer menú'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNewMenu}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Menú
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map(menu => (
            <Link key={menu.id} href={`/menus/${menu.id}`} className="block">
              <Card className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg h-full pt-0">
                <div className="relative">
                  {menu.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={menu.image} alt={menu.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-background/90 hover:bg-background"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(menu);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(menu.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{menu.name}</CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {menu.ingredients.length} ingredientes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {menu.ingredients.slice(0, 5).map((ingredient, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                    {menu.ingredients.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{menu.ingredients.length - 5} más
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <MenuEditDialog
        menu={editingMenu}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        title={editingMenu ? 'Editar Menú' : 'Nuevo Menú'}
        submitLabel={editingMenu ? 'Guardar Cambios' : 'Crear Menú'}
      />
    </div>
  );
}

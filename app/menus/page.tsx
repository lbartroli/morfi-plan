"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ChefHat, 
  Image as ImageIcon,
  X,
  Loader2,
  Search
} from "lucide-react";
import { jsonBinClient } from "@/lib/jsonbin";
import { Menu } from "@/lib/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    ingredients: "",
    image: "",
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const data = await jsonBinClient.getData();
      setMenus(data.menus);
    } catch (error) {
      toast.error("Error al cargar los menús");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("El nombre del menú es obligatorio");
      return;
    }

    const ingredients = formData.ingredients
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const menuData: Menu = {
      id: editingMenu?.id || uuidv4(),
      name: formData.name.trim(),
      ingredients,
      image: formData.image.trim() || null,
      createdAt: editingMenu?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingMenu) {
        await jsonBinClient.updateMenu(menuData);
        toast.success("Menú actualizado correctamente");
      } else {
        await jsonBinClient.addMenu(menuData);
        toast.success("Menú creado correctamente");
      }
      
      await loadMenus();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error al guardar el menú");
    }
  };

  const handleDelete = async (menuId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este menú?")) return;

    try {
      await jsonBinClient.deleteMenu(menuId);
      toast.success("Menú eliminado correctamente");
      await loadMenus();
    } catch (error) {
      toast.error("Error al eliminar el menú");
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      ingredients: menu.ingredients.join(", "),
      image: menu.image || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", ingredients: "", image: "" });
    setEditingMenu(null);
  };

  const handleNewMenu = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredMenus = menus.filter(menu =>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Biblioteca de Menús
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus recetas y menús favoritos
          </p>
        </div>
        
        <Button onClick={handleNewMenu}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Menú
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar menús o ingredientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Menús</p>
            <p className="text-2xl font-bold">{menus.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Con Imagen</p>
            <p className="text-2xl font-bold">
              {menus.filter(m => m.image).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Grid */}
      {filteredMenus.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No se encontraron menús" : "No hay menús aún"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "Intenta con otros términos de búsqueda" 
                : "Comienza creando tu primer menú"}
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
          {filteredMenus.map((menu) => (
            <Card key={menu.id} className="overflow-hidden">
              <div className="relative">
                {menu.image ? (
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/90 hover:bg-white"
                    onClick={() => handleEdit(menu)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(menu.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{menu.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
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
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "Editar Menú" : "Nuevo Menú"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Menú *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Pollo al horno con papas"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ingredients">
                Ingredientes (separados por coma)
              </Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="Ej: pollo, papas, romero, ajo, limón"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">
                URL de la Imagen
              </Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="text-xs text-gray-500">
                Pega aquí el enlace de una imagen de tu plato
              </p>
            </div>
            
            {formData.image && (
              <div className="relative">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    toast.error("Error al cargar la imagen");
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setFormData({ ...formData, image: "" })}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingMenu ? "Guardar Cambios" : "Crear Menú"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

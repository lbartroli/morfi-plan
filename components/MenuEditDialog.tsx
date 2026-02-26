'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Menu } from '@/lib/types';
import { toast } from 'sonner';

interface MenuEditDialogProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (menuData: Omit<Menu, 'createdAt' | 'updatedAt'>) => void;
  title?: string;
  submitLabel?: string;
}

function getInitialFormData(menu: Menu | null) {
  if (menu) {
    return {
      name: menu.name,
      ingredients: menu.ingredients.join(', '),
      image: menu.image || '',
    };
  }
  return {
    name: '',
    ingredients: '',
    image: '',
  };
}

export function MenuEditDialog({
  menu,
  isOpen,
  onClose,
  onSubmit,
  title = 'Editar Menú',
  submitLabel = 'Guardar Cambios',
}: MenuEditDialogProps) {
  const [formData, setFormData] = useState(() => getInitialFormData(menu));

  // Reset form data when dialog opens with a new menu
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFormData(getInitialFormData(menu));
    }
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del menú es obligatorio');
      return;
    }

    const ingredients = formData.ingredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    onSubmit({
      id: menu?.id || '',
      name: formData.name.trim(),
      ingredients,
      image: formData.image.trim() || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Menú *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Pollo al horno con papas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredientes (separados por coma)</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="Ej: pollo, papas, romero, ajo, limón"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">URL de la Imagen</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Pega aquí el enlace de una imagen de tu plato
            </p>
          </div>

          {formData.image && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.image}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
                onError={e => {
                  (e.target as HTMLImageElement).src = '';
                  toast.error('Error al cargar la imagen');
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => setFormData({ ...formData, image: '' })}
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
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

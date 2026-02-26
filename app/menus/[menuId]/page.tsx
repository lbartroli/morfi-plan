'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ChefHat,
  Image as ImageIcon,
  Loader2,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { jsonBinClient } from '@/lib/jsonbin';
import { Menu, Assignment, DayOfWeek, MealType } from '@/lib/types';
import { toast } from 'sonner';
import { MenuEditDialog } from '@/components/MenuEditDialog';

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.menuId as string;

  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const appData = await jsonBinClient.getData();

      const foundMenu = appData.menus.find(m => m.id === menuId);
      if (foundMenu) {
        setMenu(foundMenu);

        // Find all assignments for this menu
        const menuAssignments = appData.assignments.filter(a => a.menuId === menuId);
        setAssignments(menuAssignments);
      }
    } catch (_error) {
      toast.error('Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este menú?')) return;

    try {
      await jsonBinClient.deleteMenu(menuId);
      toast.success('Menú eliminado correctamente');
      router.push('/menus');
    } catch (_error) {
      toast.error('Error al eliminar el menú');
    }
  };

  const handleEdit = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (menuData: Omit<Menu, 'createdAt' | 'updatedAt'>) => {
    const fullMenuData: Menu = {
      ...menuData,
      createdAt: menu?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await jsonBinClient.updateMenu(fullMenuData);
      toast.success('Menú actualizado correctamente');
      setIsDialogOpen(false);
      await loadData();
    } catch (_error) {
      toast.error('Error al guardar el menú');
    }
  };

  const getAssignmentLabel = (assignment: Assignment) => {
    const dayNames: Record<DayOfWeek, string> = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
    };

    const mealTypeNames: Record<MealType, string> = {
      almuerzo: 'Almuerzo',
      cena: 'Cena',
    };

    return `${dayNames[assignment.day]} - ${mealTypeNames[assignment.mealType]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-16">
          <CardContent>
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Menú no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              El menú que buscas no existe o ha sido eliminado
            </p>
            <Link href="/menus">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la biblioteca
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/menus">
          <Button variant="ghost" className="pl-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a menús
          </Button>
        </Link>
      </div>

      {/* Hero Section with Image */}
      <div className="relative mb-6">
        {menu.image ? (
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={menu.image} alt={menu.name} className="w-full h-64 sm:h-80 object-cover" />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                {menu.name}
              </h1>
              <p className="text-white/80 mt-2 text-sm">{menu.ingredients.length} ingredientes</p>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                className="h-10 w-10 bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg"
                onClick={handleEdit}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 shadow-lg"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="relative">
              {/* Placeholder Background */}
              <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-green-300 dark:text-green-700" />
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                  {menu.name}
                </h1>
                <p className="text-white/80 mt-2 text-sm">{menu.ingredients.length} ingredientes</p>
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  className="h-10 w-10 bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-lg"
                  onClick={handleEdit}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 shadow-lg"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Ingredients Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Ingredientes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {menu.ingredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {menu.ingredients.map((ingredient, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1.5 capitalize">
                  {ingredient}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay ingredientes registrados para este menú
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assigned To Section */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Asignado a</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment, idx) => (
                <Badge key={idx} variant="outline" className="text-sm px-3 py-1.5">
                  <Clock className="w-3 h-3 mr-1.5" />
                  {getAssignmentLabel(assignment)}
                  {assignment.weekOffset !== 0 && (
                    <span className="ml-1 text-muted-foreground">
                      ({assignment.weekOffset > 0 ? '+' : ''}
                      {assignment.weekOffset} sem)
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta Info */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
          <span>Creado: {new Date(menu.createdAt).toLocaleDateString('es-ES')}</span>
          <span>Actualizado: {new Date(menu.updatedAt).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <MenuEditDialog
        menu={menu}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSubmit}
        title="Editar Menú"
        submitLabel="Guardar Cambios"
      />
    </div>
  );
}

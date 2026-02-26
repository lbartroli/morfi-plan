'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  ChefHat,
  Plus,
  X,
  Send,
  Loader2,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';
import { jsonBinClient } from '@/lib/jsonbin';
import { emailService } from '@/lib/email';
import {
  AppData,
  Assignment,
  DAYS_OF_WEEK,
  MEAL_TYPES,
  DayOfWeek,
  MealType,
  getCurrentWeekStart,
} from '@/lib/types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function AsignarPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [selectedMeal, setSelectedMeal] = useState<MealType | ''>('');
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const appData = await jsonBinClient.getData();
        setData(appData);
        updateShoppingList(appData);
      } catch (_error) {
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateShoppingList = (appData: AppData) => {
    const list = jsonBinClient.getShoppingList(appData.menus, appData.assignments);
    setShoppingList(list);
  };

  const handleAssign = async () => {
    if (!selectedDay || !selectedMeal || !selectedMenu || !data) return;

    const assignment: Assignment = {
      id: uuidv4(),
      menuId: selectedMenu,
      day: selectedDay,
      mealType: selectedMeal,
      weekOffset: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedAssignments = await jsonBinClient.addAssignment(assignment);
      const newData = { ...data, assignments: updatedAssignments };
      setData(newData);
      updateShoppingList(newData);

      toast.success('Menú asignado correctamente');

      // Reset selections
      setSelectedMenu('');
      setSelectedDay('');
      setSelectedMeal('');
    } catch (_error) {
      toast.error('Error al asignar el menú');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!data) return;

    try {
      const updatedAssignments = await jsonBinClient.removeAssignment(assignmentId);
      const newData = { ...data, assignments: updatedAssignments };
      setData(newData);
      updateShoppingList(newData);
      toast.success('Asignación eliminada');
    } catch (_error) {
      toast.error('Error al eliminar la asignación');
    }
  };

  const handleSendEmail = async () => {
    if (!data || !emailService.isConfigured()) {
      toast.error('El servicio de email no está configurado');
      return;
    }

    setSendingEmail(true);

    try {
      const weekStart = getCurrentWeekStart();

      // Preparar datos del menú
      const menuNames = data.assignments
        .filter(a => a.weekOffset === 0)
        .map(a => {
          const menu = data.menus.find(m => m.id === a.menuId);
          return {
            day: DAYS_OF_WEEK.find(d => d.value === a.day)?.fullLabel || a.day,
            mealType: MEAL_TYPES.find(m => m.value === a.mealType)?.label || a.mealType,
            menuName: menu?.name || 'Menú desconocido',
          };
        });

      const result = await emailService.sendWeeklyMenu(
        data.config.email,
        weekStart,
        menuNames,
        shoppingList
      );

      if (result.success) {
        toast.success('Email enviado correctamente');
      } else {
        toast.error(`Error al enviar email: ${result.error}`);
      }
    } catch (_error) {
      toast.error('Error al enviar el email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getAssignment = (day: DayOfWeek, mealType: MealType) => {
    if (!data) return null;
    return data.assignments.find(
      a => a.day === day && a.mealType === mealType && a.weekOffset === 0
    );
  };

  const getMenu = (menuId: string) => {
    if (!data) return null;
    return data.menus.find(m => m.id === menuId);
  };

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
          <h1 className="text-3xl font-bold text-foreground">Asignar Menús</h1>
          <p className="text-muted-foreground mt-1">Planifica tu semana asignando menús a cada día</p>
        </div>

        <Button
          onClick={handleSendEmail}
          disabled={sendingEmail || shoppingList.length === 0}
          variant="outline"
        >
          {sendingEmail ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar Lista
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Asignación */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nueva Asignación */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                <CardTitle>Nueva Asignación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Día</label>
                  <Select value={selectedDay} onValueChange={v => setSelectedDay(v as DayOfWeek)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.fullLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comida</label>
                  <Select value={selectedMeal} onValueChange={v => setSelectedMeal(v as MealType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comida" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map(meal => (
                        <SelectItem key={meal.value} value={meal.value}>
                          {meal.icon} {meal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Menú</label>
                  <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar menú" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.menus.map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAssign}
                disabled={!selectedDay || !selectedMeal || !selectedMenu}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Asignar Menú
              </Button>
            </CardContent>
          </Card>

          {/* Vista del Calendario */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <CardTitle>Vista Semanal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="almuerzo" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="almuerzo">☀️ Almuerzos</TabsTrigger>
                  <TabsTrigger value="cena">🌙 Cenas</TabsTrigger>
                </TabsList>

                {MEAL_TYPES.map(mealType => (
                  <TabsContent key={mealType.value} value={mealType.value}>
                    <div className="space-y-3">
                      {DAYS_OF_WEEK.map(day => {
                        const assignment = getAssignment(day.value, mealType.value);
                        const menu = assignment ? getMenu(assignment.menuId) : null;

                        return (
                          <div
                            key={day.value}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium w-24">{day.fullLabel}</span>

                              {menu ? (
                                <div className="flex items-center gap-2">
                                  {menu.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={menu.image}
                                      alt={menu.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                      <ChefHat className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="font-medium">{menu.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">Sin asignar</span>
                              )}
                            </div>

                            {assignment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Compras */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <CardTitle>Lista de Compras</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {shoppingList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No hay ingredientes en la lista</p>
                  <p className="text-xs mt-1">Asigna menús para generar la lista</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {shoppingList.length} ingredientes necesarios
                  </p>

                  <div className="space-y-2">
                    {shoppingList.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm capitalize">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

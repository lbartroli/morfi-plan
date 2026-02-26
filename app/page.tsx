"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock, 
  ChefHat, 
  ShoppingCart, 
  ArrowRight,
  Loader2,
  UtensilsCrossed,
  BookOpen,
  Plus
} from "lucide-react";
import { 
  jsonBinClient 
} from "@/lib/jsonbin";
import { 
  AppData, 
  Menu, 
  Assignment, 
  getCurrentWeekStart, 
  getWeekDays,
  DAYS_OF_WEEK,
  MEAL_TYPES,
  DayOfWeek,
  MealType
} from "@/lib/types";
import { toast } from "sonner";

// Función para obtener la comida del día según la hora
const getCurrentDayMeal = (
  assignments: Assignment[],
  menus: Menu[],
  currentDate: Date = new Date()
): { menu: Menu | null; day: DayOfWeek; mealType: MealType; label: string } | null => {
  const currentHour = currentDate.getHours();
  const currentDay = currentDate.getDay();
  
  // Mapear día de la semana
  const dayMap: { [key: number]: DayOfWeek } = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
  };
  
  const today = dayMap[currentDay];
  if (!today) return null; // Fin de semana
  
  // Entre 00:00 y 12:00 → almuerzo
  // Entre 12:00 y 23:59 → cena
  const mealType: MealType = currentHour < 12 ? 'almuerzo' : 'cena';
  const label = currentHour < 12 ? 'Almuerzo de hoy' : 'Cena de hoy';
  
  const assignment = assignments.find(
    a => a.day === today && a.mealType === mealType && a.weekOffset === 0
  );
  
  const menu = assignment ? menus.find(m => m.id === assignment.menuId) : null;
  
  return { menu: menu || null, day: today, mealType, label };
};

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMeal, setCurrentMeal] = useState<ReturnType<typeof getCurrentDayMeal>>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appData = await jsonBinClient.getData();
      setData(appData);
      setCurrentMeal(getCurrentDayMeal(appData.assignments, appData.menus));
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
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

  const weekStart = getCurrentWeekStart();
  const weekDays = getWeekDays(weekStart);
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? -1 : today.getDay() - 1;

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola! 👋
        </h1>
        <p className="text-gray-600">
          Aquí está tu planificación para esta semana
        </p>
      </div>

      {/* Acciones Rápidas - Compactas */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/menus">
          <Button variant="outline" size="sm" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Gestionar Menús
            <Badge variant="secondary" className="ml-1">
              {data?.menus.length || 0}
            </Badge>
          </Button>
        </Link>
        
        <Link href="/asignar">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Asignar Menús
          </Button>
        </Link>
        
        <Link href="/asignar">
          <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <CalendarDays className="w-4 h-4" />
            Editar Asignaciones
          </Button>
        </Link>
      </div>

      {/* Calendario Semanal */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-600" />
            <CardTitle>Calendario Semanal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vista Desktop: Sin tabs, ambas filas visibles */}
          <div className="hidden md:block space-y-6">
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType.value}>
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  {mealType.icon} {mealType.label}
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  {weekDays.map((weekDay, index) => {
                    const assignment = getAssignment(weekDay.day, mealType.value);
                    const menu = assignment ? getMenu(assignment.menuId) : null;
                    const isToday = index === currentDayIndex;

                    return (
                      <Card
                        key={`${mealType.value}-${weekDay.day}`}
                        className={`${
                          isToday 
                            ? "ring-2 ring-green-500 ring-offset-2" 
                            : ""
                        } ${
                          menu ? "" : "bg-gray-50"
                        }`}
                      >
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 text-sm">
                              {weekDay.label}
                            </span>
                            {isToday && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Hoy
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {weekDay.date.toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 px-3">
                          {menu ? (
                            <div className="space-y-2">
                              {menu.image ? (
                                <img
                                  src={menu.image}
                                  alt={menu.name}
                                  className="w-full h-16 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-full h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                  <ChefHat className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <p className="font-medium text-xs text-gray-900 line-clamp-2">
                                {menu.name}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-3 text-gray-400">
                              <ChefHat className="w-6 h-6 mx-auto mb-1 opacity-50" />
                              <p className="text-xs">Sin asignar</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Vista Mobile: Con tabs */}
          <div className="md:hidden">
            <Tabs defaultValue="almuerzo" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="almuerzo">
                  ☀️ Almuerzos
                </TabsTrigger>
                <TabsTrigger value="cena">
                  🌙 Cenas
                </TabsTrigger>
              </TabsList>

              {MEAL_TYPES.map((mealType) => (
                <TabsContent key={mealType.value} value={mealType.value}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {weekDays.map((weekDay, index) => {
                      const assignment = getAssignment(weekDay.day, mealType.value);
                      const menu = assignment ? getMenu(assignment.menuId) : null;
                      const isToday = index === currentDayIndex;

                      return (
                        <Card
                          key={weekDay.day}
                          className={`${
                            isToday 
                              ? "ring-2 ring-green-500 ring-offset-2" 
                              : ""
                          } ${
                            menu ? "" : "bg-gray-50"
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">
                                {weekDay.fullLabel}
                              </span>
                              {isToday && (
                                <Badge className="bg-green-100 text-green-800">
                                  Hoy
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {weekDay.date.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {menu ? (
                              <div className="space-y-2">
                                {menu.image ? (
                                  <img
                                    src={menu.image}
                                    alt={menu.name}
                                    className="w-full h-24 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-full h-24 bg-gray-200 rounded-md flex items-center justify-center">
                                    <ChefHat className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                <p className="font-medium text-sm text-gray-900 line-clamp-2">
                                  {menu.name}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400">
                                <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Sin asignar</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Comida del Día */}
      {currentMeal && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                {currentMeal.label}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {currentMeal.menu ? (
              <div className="flex items-start gap-4">
                {currentMeal.menu.image ? (
                  <img
                    src={currentMeal.menu.image}
                    alt={currentMeal.menu.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {DAYS_OF_WEEK.find(d => d.value === currentMeal.day)?.fullLabel}
                    </Badge>
                    <Badge variant="outline">
                      {MEAL_TYPES.find(m => m.value === currentMeal.mealType)?.label}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {currentMeal.menu.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentMeal.menu.ingredients.length} ingredientes
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 py-4">
                <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Sin menú asignado
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    No hay {currentMeal.mealType === 'almuerzo' ? 'almuerzo' : 'cena'} asignado para hoy
                  </p>
                  <Link href="/asignar">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Asignar {currentMeal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

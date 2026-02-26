'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CalendarDays,
  Clock,
  ChefHat,
  Loader2,
  UtensilsCrossed,
  BookOpen,
  Plus,
  ChevronDown,
  List,
} from 'lucide-react';
import { jsonBinClient } from '@/lib/jsonbin';
import {
  AppData,
  Menu,
  Assignment,
  getCurrentWeekStart,
  getWeekDays,
  DAYS_OF_WEEK,
  MEAL_TYPES,
  DayOfWeek,
  MealType,
} from '@/lib/types';
import { toast } from 'sonner';

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
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [ingredientsOpen, setIngredientsOpen] = useState(false);

  useEffect(() => {
    loadData();
    // Actualizar la hora cada minuto
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const appData = await jsonBinClient.getData();
      setData(appData);
      setCurrentMeal(getCurrentDayMeal(appData.assignments, appData.menus));
    } catch (_error) {
      toast.error('Error al cargar los datos');
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

  // Determinar qué fila debe tener el borde verde según la hora
  // 00:00-12:00 → almuerzo tiene borde verde
  // 12:00-23:59 → cena tiene borde verde
  const highlightedMealType: MealType = currentHour < 12 ? 'almuerzo' : 'cena';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">¡Hola! 👋</h1>
        <p className="text-sm text-muted-foreground">Aquí está tu planificación para esta semana</p>
      </div>

      {/* Acciones Rápidas - Compactas */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/menus">
          <Button variant="outline" size="sm" className="gap-1 h-8">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs">Menús</span>
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
              {data?.menus.length || 0}
            </Badge>
          </Button>
        </Link>

        <Link href="/asignar">
          <Button variant="default" size="sm" className="gap-1 h-8 bg-green-600 hover:bg-green-700">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-xs">Editar</span>
          </Button>
        </Link>
      </div>

      {/* Comida del Día - AHORA PRIMERO */}
      {currentMeal && (
        <Card className="overflow-hidden relative border-0 shadow-lg mb-6">
          {currentMeal.menu?.image ? (
            <>
              {/* Background Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentMeal.menu.image}
                alt={currentMeal.menu.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/30" />
              {/* Content */}
              <div className="relative z-10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-white/80" />
                  <span className="text-sm font-medium text-white/80">{currentMeal.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {DAYS_OF_WEEK.find(d => d.value === currentMeal.day)?.fullLabel}
                  </Badge>
                  <Badge className="bg-green-500 text-white border-0 text-xs">
                    {MEAL_TYPES.find(m => m.value === currentMeal.mealType)?.label}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-4">
                  {currentMeal.menu.name}
                </h3>

                {/* Ingredientes expandibles */}
                <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-between h-9 text-sm text-white/90 hover:bg-white/20 hover:text-white px-3 -ml-3 bg-white/10 backdrop-blur-sm rounded-lg"
                    >
                      <span className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Ver ingredientes ({currentMeal.menu.ingredients.length})
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${ingredientsOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/20">
                      <div className="flex flex-wrap gap-2">
                        {currentMeal.menu.ingredients.map((ingredient, idx) => (
                          <Badge
                            key={idx}
                            className="text-sm font-normal capitalize bg-white/20 text-white border-0"
                          >
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          ) : (
            <>
              <CardHeader className="pb-3 pt-4 bg-linear-to-r from-green-600 to-green-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white" />
                  <CardTitle className="text-base text-white">{currentMeal.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {currentMeal.menu ? (
                  <div>
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border-2 border-border">
                        <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {DAYS_OF_WEEK.find(d => d.value === currentMeal.day)?.fullLabel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {MEAL_TYPES.find(m => m.value === currentMeal.mealType)?.label}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {currentMeal.menu.name}
                        </h3>
                      </div>
                    </div>

                    {/* Ingredientes expandibles */}
                    <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between h-8 text-xs bg-white hover:bg-gray-50"
                        >
                          <span className="flex items-center gap-2">
                            <List className="w-3.5 h-3.5" />
                            Ver ingredientes ({currentMeal.menu.ingredients.length})
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${ingredientsOpen ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex flex-wrap gap-1.5">
                            {currentMeal.menu.ingredients.map((ingredient, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs font-normal capitalize"
                              >
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border-2 border-border">
                      <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-0.5">
                        Sin menú asignado
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        No hay {currentMeal.mealType === 'almuerzo' ? 'almuerzo' : 'cena'} asignado
                        para hoy
                      </p>
                      <Link href="/asignar">
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Asignar {currentMeal.mealType === 'almuerzo' ? 'Almuerzo' : 'Cena'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Calendario Semanal - AHORA DESPUÉS */}
      <Card className="mb-6">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Calendario Semanal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Vista Desktop: Sin tabs, ambas filas visibles */}
          <div className="hidden md:block space-y-3">
            {MEAL_TYPES.map(mealType => (
              <div key={mealType.value}>
                <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <span>{mealType.icon}</span> <span>{mealType.label}</span>
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {weekDays.map((weekDay, index) => {
                    const assignment = getAssignment(weekDay.day, mealType.value);
                    const menu = assignment ? getMenu(assignment.menuId) : null;
                    const isToday = index === currentDayIndex;
                    // Borde verde solo en la fila correspondiente según la hora
                    const shouldHighlight = isToday && mealType.value === highlightedMealType;

                    return (
                      <Tooltip key={`${mealType.value}-${weekDay.day}`}>
                        <TooltipTrigger asChild>
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden relative p-2 gap-2 ${
                              shouldHighlight ? 'ring-2 ring-green-500 ring-offset-1' : ''
                            } ${menu ? '' : 'bg-muted/50'}`}
                          >
                            {menu?.image ? (
                              <>
                                {/* Background Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={menu.image}
                                  alt={menu.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
                                {/* Content */}
                                <div className="relative z-10 p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white text-xs drop-shadow-md">
                                      {weekDay.label}
                                    </span>
                                    {isToday && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 border-0">
                                        Hoy
                                      </Badge>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-white/80 drop-shadow-md">
                                      {weekDay.date.toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                    </span>
                                    <p className="font-medium text-[10px] text-white line-clamp-2 leading-tight drop-shadow-md mt-0.5">
                                      {menu.name}
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <CardHeader className="pb-0.5 pt-1.5 px-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground text-xs">
                                      {weekDay.label}
                                    </span>
                                    {isToday && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Hoy
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground leading-none">
                                    {weekDay.date.toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                </CardHeader>
                                <CardContent className="pt-0 pb-1 px-2">
                                  {menu && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-6 h-6 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        <ChefHat className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <p className="font-medium text-[10px] text-foreground line-clamp-1 leading-none">
                                        {menu.name}
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </>
                            )}
                          </Card>
                        </TooltipTrigger>
                        {menu && (
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="font-semibold text-xs mb-1">{menu.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {menu.ingredients.slice(0, 5).join(', ')}
                            </p>
                            {menu.ingredients.length > 5 && (
                              <p className="text-xs text-muted-foreground/70">
                                y {menu.ingredients.length - 5} más...
                              </p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Vista Mobile: Con tabs */}
          <div className="md:hidden">
            <Tabs defaultValue={highlightedMealType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-8">
                <TabsTrigger value="almuerzo" className="text-xs">
                  ☀️ Almuerzos
                </TabsTrigger>
                <TabsTrigger value="cena" className="text-xs">
                  🌙 Cenas
                </TabsTrigger>
              </TabsList>

              {MEAL_TYPES.map(mealType => (
                <TabsContent key={mealType.value} value={mealType.value}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {weekDays.map((weekDay, index) => {
                      const assignment = getAssignment(weekDay.day, mealType.value);
                      const menu = assignment ? getMenu(assignment.menuId) : null;
                      const isToday = index === currentDayIndex;
                      const shouldHighlight = isToday && mealType.value === highlightedMealType;

                      return (
                        <Card
                          key={weekDay.day}
                          className={`overflow-hidden relative ${
                            shouldHighlight ? 'ring-2 ring-green-500 ring-offset-2' : ''
                          } ${menu ? '' : 'bg-muted/50'}`}
                        >
                          {menu?.image ? (
                            <>
                              {/* Background Image */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                              {/* Content */}
                              <div className="relative z-10 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white text-sm drop-shadow-md">
                                    {weekDay.fullLabel}
                                  </span>
                                  {isToday && (
                                    <Badge className="bg-green-500 text-white text-xs border-0">
                                      Hoy
                                    </Badge>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs text-white/80 drop-shadow-md">
                                    {weekDay.date.toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </span>
                                  <p className="font-medium text-sm text-white line-clamp-2 drop-shadow-md mt-1">
                                    {menu.name}
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <CardHeader className="pb-0.5 pt-2 px-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground text-sm">
                                    {weekDay.fullLabel}
                                  </span>
                                  {isToday && (
                                    <Badge variant="secondary" className="text-xs">
                                      Hoy
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground leading-none">
                                  {weekDay.date.toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                </span>
                              </CardHeader>
                              <CardContent className="pt-0 pb-2 px-3">
                                {menu ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                      <ChefHat className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <p className="font-medium text-sm text-foreground line-clamp-1">
                                      {menu.name}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center py-1 text-muted-foreground">
                                    <ChefHat className="w-5 h-5 mx-auto opacity-50" />
                                  </div>
                                )}
                              </CardContent>
                            </>
                          )}
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
    </div>
  );
}

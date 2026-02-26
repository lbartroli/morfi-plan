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
  UtensilsCrossed
} from "lucide-react";
import { 
  jsonBinClient 
} from "@/lib/jsonbin";
import { 
  AppData, 
  Menu, 
  Assignment, 
  getNextMeal, 
  getCurrentWeekStart, 
  getWeekDays,
  DAYS_OF_WEEK,
  MEAL_TYPES,
  DayOfWeek,
  MealType
} from "@/lib/types";
import { toast } from "sonner";

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextMeal, setNextMeal] = useState<ReturnType<typeof getNextMeal>>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appData = await jsonBinClient.getData();
      setData(appData);
      setNextMeal(getNextMeal(appData.assignments, appData.menus));
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Hola! 👋
        </h1>
        <p className="text-gray-600">
          Aquí está tu planificación para esta semana
        </p>
      </div>

      {/* Próxima Comida */}
      {nextMeal?.menu && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                Próxima Comida
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {nextMeal.menu.image ? (
                <img
                  src={nextMeal.menu.image}
                  alt={nextMeal.menu.name}
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
                    {DAYS_OF_WEEK.find(d => d.value === nextMeal.day)?.fullLabel}
                  </Badge>
                  <Badge variant="outline">
                    {MEAL_TYPES.find(m => m.value === nextMeal.mealType)?.label}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {nextMeal.menu.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {nextMeal.menu.ingredients.length} ingredientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendario Semanal */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <CardTitle>Calendario Semanal</CardTitle>
            </div>
            <Link href="/asignar">
              <Button variant="outline" size="sm">
                Editar Asignaciones
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/menus">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Gestionar Menús</h3>
                  <p className="text-sm text-gray-600">
                    {data?.menus.length || 0} menús disponibles
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/asignar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Asignar Menús</h3>
                  <p className="text-sm text-gray-600">
                    Planifica tu semana
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

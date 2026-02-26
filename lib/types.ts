export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
export type MealType = 'almuerzo' | 'cena';
export type SendDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface Menu {
  id: string;
  name: string;
  ingredients: string[];
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  menuId: string;
  day: DayOfWeek;
  mealType: MealType;
  weekOffset: number;
  createdAt: string;
}

export interface AppData {
  menus: Menu[];
  assignments: Assignment[];
  config: {
    emails: string[];
    sendDay: SendDay;
    sendHour: number;
  };
}

export interface WeekDay {
  day: DayOfWeek;
  label: string;
  fullLabel: string;
  date: Date;
}

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; fullLabel: string }[] = [
  { value: 'lunes', label: 'Lun', fullLabel: 'Lunes' },
  { value: 'martes', label: 'Mar', fullLabel: 'Martes' },
  { value: 'miercoles', label: 'Mié', fullLabel: 'Miércoles' },
  { value: 'jueves', label: 'Jue', fullLabel: 'Jueves' },
  { value: 'viernes', label: 'Vie', fullLabel: 'Viernes' },
];

export const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'almuerzo', label: 'Almuerzo', icon: '☀️' },
  { value: 'cena', label: 'Cena', icon: '🌙' },
];

export const getNextMeal = (
  assignments: Assignment[],
  menus: Menu[],
  currentDate: Date = new Date()
): {
  assignment: Assignment | null;
  menu: Menu | null;
  day: DayOfWeek;
  mealType: MealType;
} | null => {
  const currentDay = currentDate.getDay();
  const currentHour = currentDate.getHours();

  // Convertir día de la semana (0=Domingo, 1=Lunes, ...) a nuestro formato
  const dayMap: { [key: number]: DayOfWeek } = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
  };

  const today = dayMap[currentDay];

  if (!today) return null; // Es fin de semana

  // Determinar si ya pasó el almuerzo (14:00) y la cena (21:00)
  const isLunchTime = currentHour < 14;
  const isDinnerTime = currentHour >= 14 && currentHour < 21;

  // Buscar la próxima comida
  const daysOrder: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const todayIndex = daysOrder.indexOf(today);

  // Buscar en el día actual primero
  if (isLunchTime) {
    const assignment = assignments.find(a => a.day === today && a.mealType === 'almuerzo');
    if (assignment) {
      const menu = menus.find(m => m.id === assignment.menuId);
      return { assignment, menu: menu || null, day: today, mealType: 'almuerzo' };
    }
  }

  if (isLunchTime || isDinnerTime) {
    const assignment = assignments.find(a => a.day === today && a.mealType === 'cena');
    if (assignment) {
      const menu = menus.find(m => m.id === assignment.menuId);
      return { assignment, menu: menu || null, day: today, mealType: 'cena' };
    }
  }

  // Buscar en los siguientes días
  for (let i = 1; i < 5; i++) {
    const nextIndex = (todayIndex + i) % 5;
    const nextDay = daysOrder[nextIndex];

    // Primero buscar almuerzo
    const lunchAssignment = assignments.find(a => a.day === nextDay && a.mealType === 'almuerzo');
    if (lunchAssignment) {
      const menu = menus.find(m => m.id === lunchAssignment.menuId);
      return {
        assignment: lunchAssignment,
        menu: menu || null,
        day: nextDay,
        mealType: 'almuerzo',
      };
    }

    // Luego cena
    const dinnerAssignment = assignments.find(a => a.day === nextDay && a.mealType === 'cena');
    if (dinnerAssignment) {
      const menu = menus.find(m => m.id === dinnerAssignment.menuId);
      return { assignment: dinnerAssignment, menu: menu || null, day: nextDay, mealType: 'cena' };
    }
  }

  return null;
};

export const getCurrentWeekStart = (): Date => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const getWeekDays = (weekStart: Date): WeekDay[] => {
  const days: WeekDay[] = [];
  const dayNames: { [key in DayOfWeek]: { label: string; fullLabel: string } } = {
    lunes: { label: 'Lun', fullLabel: 'Lunes' },
    martes: { label: 'Mar', fullLabel: 'Martes' },
    miercoles: { label: 'Mié', fullLabel: 'Miércoles' },
    jueves: { label: 'Jue', fullLabel: 'Jueves' },
    viernes: { label: 'Vie', fullLabel: 'Viernes' },
  };

  const dayKeys: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  dayKeys.forEach((dayKey, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    days.push({
      day: dayKey,
      ...dayNames[dayKey],
      date,
    });
  });

  return days;
};

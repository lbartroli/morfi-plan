import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { jsonBinClient } from '@/lib/jsonbin';
import { DAYS_OF_WEEK, MEAL_TYPES } from '@/lib/types';

export async function POST(_request: Request) {
  try {
    // Obtener datos de la aplicación
    const data = await jsonBinClient.getData();

    if (data.assignments.length === 0) {
      return NextResponse.json({ error: 'No hay asignaciones para enviar' }, { status: 400 });
    }

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

    // Generar lista de compras
    const shoppingList = jsonBinClient.getShoppingList(data.menus, data.assignments);

    // Enviar email
    const result = await emailService.sendWeeklyMenu(
      data.config.email,
      new Date(),
      menuNames,
      shoppingList
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { jsonBinClient } from '@/lib/jsonbin';

export async function POST(_request: Request) {
  try {
    // Obtener datos de la aplicación
    const data = await jsonBinClient.getData();

    if (data.assignments.length === 0) {
      return NextResponse.json({ error: 'No hay asignaciones para enviar' }, { status: 400 });
    }

    // Filter valid emails
    const validEmails = data.config.emails.filter(e => e && e.trim() !== '');
    
    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No hay emails configurados' }, { status: 400 });
    }

    // Generar lista de compras
    const shoppingList = jsonBinClient.getShoppingList(data.menus, data.assignments);

    // Enviar email a todos los destinatarios
    const result = await emailService.sendWeeklyMenu(
      validEmails,
      new Date(),
      shoppingList
    );

    if (result.success) {
      return NextResponse.json({ success: true, recipients: validEmails.length });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

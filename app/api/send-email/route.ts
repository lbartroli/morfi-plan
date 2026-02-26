import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { jsonBinClient } from '@/lib/jsonbin';

const CRON_SECRET = process.env.CRON_SECRET;

// Day mapping: config values to JavaScript getUTCDay() values
const DAY_MAP: { [key: string]: number } = {
  sunday: 0, // Sunday
  saturday: 6, // Saturday
};

export async function POST(request: Request) {
  try {
    // Obtener datos de la aplicación
    const data = await jsonBinClient.getData();

    // Verificar si es una llamada desde GitHub Actions (con secreto)
    const authHeader = request.headers.get('Authorization');
    const isCronJob = authHeader === `Bearer ${CRON_SECRET}`;

    if (isCronJob && CRON_SECRET) {
      // Es una llamada programada desde GitHub Actions
      const body = await request.json().catch(() => ({}));
      const trigger = body.trigger || 'scheduled';

      if (trigger === 'scheduled') {
        // Verificar si es el día y hora correctos (UTC)
        const now = new Date();
        const currentHour = now.getUTCHours();
        const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

        const configDay = DAY_MAP[data.config.sendDay] ?? 0;
        const configHour = data.config.sendHour ?? 12; // Default to 12 UTC (9 AM Argentina)

        console.log('Scheduled check:', {
          currentDay,
          currentHour,
          configDay,
          configHour,
          sendDay: data.config.sendDay,
        });

        if (currentDay !== configDay || currentHour !== configHour) {
          return NextResponse.json({
            success: true,
            skipped: true,
            message: `Not time yet. Current: ${currentDay}:${currentHour}, Config: ${configDay}:${configHour}`,
          });
        }
      }
      // Si es 'manual' desde GitHub Actions, enviar inmediatamente
    }

    // El resto de las validaciones aplican para cualquier llamada
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
    const result = await emailService.sendWeeklyMenu(validEmails, new Date(), shoppingList);

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

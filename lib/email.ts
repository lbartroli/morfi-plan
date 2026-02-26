import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    if (RESEND_API_KEY) {
      this.resend = new Resend(RESEND_API_KEY);
    }
  }

  async sendWeeklyMenu(
    to: string,
    weekStart: Date,
    menuNames: { day: string; mealType: string; menuName: string }[],
    shoppingList: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      return { success: false, error: 'Resend no configurado' };
    }

    const weekLabel = weekStart.toLocaleDateString('es-ES', {
      month: 'long',
      day: 'numeric',
    });

    // Formatear el menú semanal
    const menuHtml = menuNames
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.day}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.mealType}</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">${item.menuName}</td>
          </tr>
        `
      )
      .join('');

    // Formatear lista de compras
    const shoppingHtml = shoppingList
      .map(
        (item, index) => `
          <li style="padding: 5px 0;">${index + 1}. ${item}</li>
        `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #16a34a; margin-bottom: 20px;">🍽️ Menú Semanal - ${weekLabel}</h1>
        
        <h2 style="color: #374151; margin-top: 30px;">Planificación</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Día</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Comida</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Menú</th>
            </tr>
          </thead>
          <tbody>
            ${menuHtml}
          </tbody>
        </table>
        
        <h2 style="color: #374151;">🛒 Lista de Compras</h2>
        <ul style="list-style: none; padding: 0;">
          ${shoppingHtml}
        </ul>
        
        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          Generado automáticamente por Morfi-Plan 🍳
        </p>
      </div>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: 'Morfi-Plan <noreply@morfi-plan.resend.dev>',
        to: [to],
        subject: `🍽️ Menú Semanal - Semana del ${weekLabel}`,
        html,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  isConfigured(): boolean {
    return !!this.resend;
  }
}

export const emailService = new EmailService();

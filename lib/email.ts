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
    to: string[],
    weekStart: Date,
    shoppingList: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      return { success: false, error: 'Resend no configurado' };
    }

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
        <h1 style="color: #16a34a; margin-bottom: 20px;">🛒 Lista de Compras para esta semana</h1>
        
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
        from: 'Morfi-Plan <morfi-plan@lucasbartroli.dev>',
        to: to,
        subject: `🛒 Lista de Compras para esta semana`,
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

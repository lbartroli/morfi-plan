'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jsonBinClient } from '@/lib/jsonbin';
import { AppData, SendDay } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Mail, Clock, Calendar, Save, Send, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DAYS_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`,
}));

// Convert UTC hour to local hour for display
const utcToLocal = (utcHour: number): number => {
  const date = new Date();
  date.setUTCHours(utcHour, 0, 0, 0);
  return date.getHours();
};

// Convert local hour to UTC for storage
const localToUtc = (localHour: number): number => {
  const date = new Date();
  date.setHours(localHour, 0, 0, 0);
  return date.getUTCHours();
};

// Auto-migration: assume old configs are in Argentina time (UTC-3)
const migrateFromArgentinaTime = (storedHour: number): number => {
  // Argentina is UTC-3, so add 3 hours to get UTC
  return (storedHour + 3) % 24;
};

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<AppData['config']>({
    emails: [''],
    sendDay: 'sunday',
    sendHour: 12, // Default: 9 AM Argentina = 12 UTC
  });
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await jsonBinClient.getConfig();

      // Auto-migration: check if config needs UTC conversion
      // Old configs were stored in local Argentina time (default 9)
      // New configs are stored in UTC (default 12)
      let migratedHour = data.sendHour ?? 12;
      const isMigrated = (data as unknown as { _utcMigrated?: boolean })._utcMigrated;

      if (!isMigrated && migratedHour < 12) {
        // Likely old format (Argentina local time), migrate to UTC
        migratedHour = migrateFromArgentinaTime(migratedHour);
        // Silently update the config with UTC time and migration flag
        await jsonBinClient.updateConfig({
          ...data,
          sendHour: migratedHour,
          _utcMigrated: true,
        } as unknown as AppData['config']);
      }

      // Convert UTC to local for display
      const displayHour = utcToLocal(migratedHour);

      setConfig({
        emails: data.emails || [''],
        sendDay: data.sendDay || 'sunday',
        sendHour: displayHour, // Store local hour in state for UI
      });
    } catch (_error) {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Filter out empty emails
    const validEmails = config.emails.filter(e => e.trim() !== '');

    if (validEmails.length === 0) {
      toast.error('Debes configurar al menos un email');
      return;
    }

    // Validate format of all emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      toast.error(`Emails inválidos: ${invalidEmails.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Convert local hour to UTC for storage
      const utcHour = localToUtc(config.sendHour);

      const configToSave = {
        ...config,
        emails: validEmails,
        sendHour: utcHour,
        _utcMigrated: true,
      } as unknown as AppData['config'];

      await jsonBinClient.updateConfig(configToSave);
      setConfig(config);
      toast.success('Configuración guardada correctamente');
    } catch (_error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const validEmails = config.emails.filter(e => e.trim() !== '');

    if (validEmails.length === 0) {
      toast.error('Configura al menos un email primero');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success(`Email de prueba enviado a ${validEmails.length} destinatario(s)`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al enviar el email');
      }
    } catch (_error) {
      toast.error('Error al enviar el email de prueba');
    } finally {
      setSending(false);
    }
  };

  const addEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      toast.error('Ingresa un email');
      return;
    }
    if (!emailRegex.test(newEmail)) {
      toast.error('El formato del email no es válido');
      return;
    }
    if (config.emails.includes(newEmail.trim())) {
      toast.error('Este email ya está en la lista');
      return;
    }
    setConfig({ ...config, emails: [...config.emails, newEmail.trim()] });
    setNewEmail('');
  };

  const removeEmail = (index: number) => {
    const newEmails = config.emails.filter((_, i) => i !== index);
    setConfig({ ...config, emails: newEmails.length > 0 ? newEmails : [''] });
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...config.emails];
    newEmails[index] = value;
    setConfig({ ...config, emails: newEmails });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Configura los ajustes de notificaciones por email
        </p>
      </div>

      {/* Email Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Configura dónde y cuándo enviar el menú semanal automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email List */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Emails de Destino
            </Label>

            {/* Existing Emails */}
            <div className="space-y-2">
              {config.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="ejemplo@email.com"
                    value={email}
                    onChange={e => updateEmail(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeEmail(index)}
                    disabled={config.emails.length === 1 && !email}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add New Email */}
            <div className="flex gap-2 pt-2">
              <Input
                type="email"
                placeholder="Agregar nuevo email..."
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" onClick={addEmail}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              El menú semanal y la lista de compras se enviarán a todos estos emails
            </p>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Día de Envío
            </Label>
            <Select
              value={config.sendDay}
              onValueChange={value => setConfig({ ...config, sendDay: value as SendDay })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un día" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OPTIONS.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              El email se enviará automáticamente el día seleccionado
            </p>
          </div>

          {/* Hour Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Hora de Envío
            </Label>
            <Select
              value={config.sendHour.toString()}
              onValueChange={value => setConfig({ ...config, sendHour: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una hora" />
              </SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.map(hour => (
                  <SelectItem key={hour.value} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Hora a la que se enviará el email (en tu zona horaria local)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={sending}
              className="flex-1"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Email de Prueba
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Sobre las Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>El email incluirá:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>El menú semanal completo (almuerzos y cenas)</li>
            <li>La lista de compras generada automáticamente</li>
            <li>Ingredientes de todos los platos asignados</li>
          </ul>
          <p className="pt-2">
            Puedes enviar el menú semanal manualmente en cualquier momento desde la página{' '}
            <strong>Asignar</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

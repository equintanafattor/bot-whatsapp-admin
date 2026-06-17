import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../../api/tenants';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const mutation = useMutation({
    mutationFn: () => changePassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => {
      toast.error('Error al cambiar la contraseña. Verificá que la contraseña actual sea correcta.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="p-8 max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cambiar contraseña</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
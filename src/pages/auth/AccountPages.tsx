import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { acceptInvite, forgotPassword, getInvite, resetPassword } from "../../api/account";
import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../lib/auth-context";
import type { AuthResponse } from "../../types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function BackToLogin() {
  return (
    <p className="text-sm text-center mt-4">
      <Link to="/login" className="text-blue-600 hover:underline">Volver a iniciar sesión</Link>
    </p>
  );
}

/** Formulario de nueva contraseña con confirmación; al terminar inicia sesión. */
function NewPasswordForm({
  submitLabel,
  onSubmit,
}: {
  submitLabel: string;
  onSubmit: (password: string) => Promise<AuthResponse>;
}) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setError("Las contraseñas no coinciden.");

    setLoading(true);
    try {
      const response = await onSubmit(password);
      signIn(response.token, { email: response.email, role: response.role, tenantId: response.tenantId });
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo guardar la contraseña."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" type="password" autoComplete="new-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">Repetila</Label>
        <Input id="confirmation" type="password" autoComplete="new-password" value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      setSentMessage(await forgotPassword(email));
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo enviar el pedido. Probá de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Recuperar contraseña" description="Te mandamos un link a tu email para elegir una nueva.">
      {sentMessage ? (
        <p className="text-sm text-center">{sentMessage} Revisá también la carpeta de spam.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="tu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
      <BackToLogin />
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  return (
    <AuthCard title="Nueva contraseña">
      {token ? (
        <NewPasswordForm submitLabel="Guardar e ingresar" onSubmit={(password) => resetPassword(token, password)} />
      ) : (
        <p className="text-sm text-center text-red-500">El link no es válido. Pedí uno nuevo.</p>
      )}
      <BackToLogin />
    </AuthCard>
  );
}

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const { data: invite, error, isLoading } = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInvite(token),
    enabled: !!token,
    retry: false,
  });

  if (!token || error) {
    return (
      <AuthCard title="Invitación">
        <p className="text-sm text-center text-red-500">
          {error ? getApiErrorMessage(error, "La invitación no es válida.") : "La invitación no es válida."}{" "}
          Pedile a quien te invitó que te mande una nueva.
        </p>
        <BackToLogin />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Bienvenido/a"
      description={
        invite
          ? <>Te invitaron al panel de <strong>{invite.businessName ?? "un negocio"}</strong> como {invite.email}. Elegí tu contraseña para entrar.</>
          : undefined
      }
    >
      {isLoading ? (
        <p className="text-sm text-center text-muted-foreground">Cargando...</p>
      ) : (
        <NewPasswordForm submitLabel="Crear cuenta e ingresar" onSubmit={(password) => acceptInvite(token, password)} />
      )}
    </AuthCard>
  );
}

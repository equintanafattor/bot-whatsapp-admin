import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTeam, inviteUser, removeUser, type TeamMember } from "../../api/account";
import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../lib/auth-context";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function TeamPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", tenantId],
    queryFn: () => getTeam(tenantId!),
    enabled: !!tenantId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["team", tenantId] });

  const inviteMutation = useMutation({
    mutationFn: (target: string) => inviteUser(tenantId!, target),
    onSuccess: (message) => {
      toast.success(message);
      setEmail("");
      refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo enviar la invitación.")),
  });

  const removeMutation = useMutation({
    mutationFn: (member: TeamMember) => removeUser(tenantId!, member.id),
    onSuccess: (message) => {
      toast.success(message);
      refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo quitar el usuario.")),
  });

  const atLimit = !!team?.maxUsers && team.users.length >= team.maxUsers;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
        <p className="text-muted-foreground mt-1">
          Personas con acceso al panel de este negocio.
          {team?.maxUsers ? ` Tu plan permite ${team.maxUsers} usuario(s).` : ""}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Invitar a alguien</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col sm:flex-row gap-2 sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate(email);
            }}
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="persona@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={inviteMutation.isPending || atLimit}>
              {inviteMutation.isPending ? "Enviando..." : "Enviar invitación"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            {atLimit
              ? "Llegaste al límite de usuarios de tu plan."
              : "Le llega un email con un link para elegir su contraseña. El link vence en 7 días."}
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {team?.users.map((member) => {
              const isMe = member.email.toLowerCase() === user?.email?.toLowerCase();
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.email} {isMe && <span className="text-muted-foreground">(vos)</span>}
                  </TableCell>
                  <TableCell>
                    {member.invitationPending ? (
                      <Badge variant="outline">Invitación pendiente</Badge>
                    ) : (
                      <Badge variant="secondary">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(member.createdAtUtc).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {member.invitationPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={inviteMutation.isPending}
                        onClick={() => inviteMutation.mutate(member.email)}
                      >
                        Reenviar
                      </Button>
                    )}
                    {!isMe && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          if (confirm(`¿Quitarle el acceso al panel a ${member.email}?`)) {
                            removeMutation.mutate(member);
                          }
                        }}
                      >
                        Quitar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

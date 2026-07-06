import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getWhatsAppProfile,
  updateWhatsAppProfile,
  uploadWhatsAppLogo,
  getTenant,
  type WhatsAppProfile,
} from "../../api/tenants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Lock, MapPin, Mail, Globe, Camera } from "lucide-react";
import { toast } from "sonner";

const VERTICALS = [
  "Alcohol",
  "Automotive",
  "Beauty, Spa and Salon",
  "Clothing and Apparel",
  "Education",
  "Entertainment",
  "Event Planning and Service",
  "Finance and Banking",
  "Food and Grocery",
  "Hotel and Lodging",
  "Medical and Health",
  "Non-profit",
  "Professional Services",
  "Public Service",
  "Restaurant",
  "Shopping and Retail",
  "Travel and Transportation",
  "Other",
];

const EMPTY: WhatsAppProfile = {
  about: "",
  description: "",
  address: "",
  email: "",
  website: "",
  vertical: "",
  logoUrl: "",
};

export default function WhatsAppProfilePage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<WhatsAppProfile>(EMPTY);

  const { data: tenant } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenant(tenantId!),
    enabled: !!tenantId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-profile", tenantId],
    queryFn: () => getWhatsAppProfile(tenantId!),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        about: data.profile.about ?? "",
        description: data.profile.description ?? "",
        address: data.profile.address ?? "",
        email: data.profile.email ?? "",
        website: data.profile.website ?? "",
        vertical: data.profile.vertical ?? "",
        logoUrl: data.profile.logoUrl ?? "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => updateWhatsAppProfile(tenantId!, form),
    onSuccess: () =>
      toast.success(
        "Perfil actualizado. Los cambios pueden tardar unos minutos en reflejarse.",
      ),
    onError: () => toast.error("Error al actualizar el perfil."),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadWhatsAppLogo(tenantId!, file),
    onSuccess: (url) => {
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success("Logo subido. Acordate de guardar los cambios.");
    },
    onError: () => toast.error("Error al subir el logo."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB.");
      return;
    }
    uploadMutation.mutate(file);
  };

  const businessName = tenant?.businessName ?? "Tu negocio";
  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (data && !data.configured) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Perfil de WhatsApp
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-6 mt-4">
          <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-1">
            WhatsApp Sender no configurado
          </p>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            Este tenant todavía no tiene un número de WhatsApp productivo
            conectado. Una vez que el número esté activo en Twilio, vas a poder
            editar el perfil desde acá.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Perfil de WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Editá cómo ven tu negocio los clientes en WhatsApp
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      <div className="flex gap-6 flex-wrap">
        {/* Editor */}
        <div className="flex-1 min-w-[300px] max-w-md">
          <div className="bg-card rounded-xl border p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div
                  className="w-22 h-22 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-3xl font-medium overflow-hidden"
                  style={{ width: 88, height: 88 }}
                >
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-card border flex items-center justify-center shadow-sm hover:bg-muted disabled:opacity-50"
                >
                  <Camera size={15} className="text-muted-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {uploadMutation.isPending ? "Subiendo..." : "Foto de perfil"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">URL del logo</Label>
                <Input
                  id="logoUrl"
                  value={form.logoUrl ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, logoUrl: e.target.value })
                  }
                  placeholder="https://tunegocio.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Pegá el link de una imagen ya publicada (tiene que empezar con
                  https://).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre del negocio</Label>
                <Input value={businessName} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock size={11} /> Cambio sujeto a revisión de Meta (cada 30
                  días)
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="about">Acerca de</Label>
                <Input
                  id="about"
                  value={form.about ?? ""}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="Ej: Nutrición personalizada en Paraná 🥗"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[64px] px-3 py-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Contá brevemente qué hace tu negocio"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vertical">Categoría</Label>
                <select
                  id="vertical"
                  className="w-full h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card"
                  value={form.vertical ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, vertical: e.target.value })
                  }
                >
                  <option value="">Seleccionar...</option>
                  {VERTICALS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={form.address ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Ej: Oro Verde, Entre Ríos"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="hola@tunegocio.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  value={form.website ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  placeholder="www.tunegocio.com"
                />
              </div>

              <Button
                className="w-full bg-[#1D9E75] hover:bg-[#178963] text-white"
                onClick={() => {
                  if (form.logoUrl && !form.logoUrl.startsWith("https://")) {
                    toast.error("La URL del logo debe empezar con https://");
                    return;
                  }
                  updateMutation.mutate();
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </div>

        {/* Vista previa WhatsApp */}
        <div className="flex-1 min-w-[280px] max-w-sm">
          <p className="text-sm text-muted-foreground mb-2 font-medium">
            Vista previa
          </p>
          <div className="bg-[#0B141A] rounded-xl overflow-hidden border">
            <div className="h-28 bg-[#1D9E75]" />
            <div className="px-4 pb-4 -mt-11">
              <div
                className="w-22 h-22 rounded-full bg-[#128C5E] border-[3px] border-[#0B141A] flex items-center justify-center text-white text-3xl font-medium overflow-hidden"
                style={{ width: 88, height: 88 }}
              >
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              <p className="text-white text-lg font-medium mt-3 mb-0.5">
                {businessName}
              </p>
              <p className="text-[#8696A0] text-xs mb-4">Cuenta de empresa</p>

              {form.about && (
                <div className="bg-[#182229] rounded-lg p-3 mb-2.5">
                  <p className="text-[#25D366] text-xs mb-0.5">Acerca de</p>
                  <p className="text-[#E9EDEF] text-sm">{form.about}</p>
                </div>
              )}

              <div className="bg-[#182229] rounded-lg p-3 space-y-3">
                {form.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size={18} className="text-[#8696A0] shrink-0" />
                    <span className="text-[#E9EDEF] text-sm">
                      {form.address}
                    </span>
                  </div>
                )}
                {form.email && (
                  <div className="flex items-start gap-2.5">
                    <Mail size={18} className="text-[#8696A0] shrink-0" />
                    <span className="text-[#E9EDEF] text-sm">{form.email}</span>
                  </div>
                )}
                {form.website && (
                  <div className="flex items-start gap-2.5">
                    <Globe size={18} className="text-[#8696A0] shrink-0" />
                    <span className="text-[#25D366] text-sm">
                      {form.website}
                    </span>
                  </div>
                )}
                {!form.address && !form.email && !form.website && (
                  <p className="text-[#8696A0] text-sm text-center py-2">
                    Completá los campos para ver la vista previa
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

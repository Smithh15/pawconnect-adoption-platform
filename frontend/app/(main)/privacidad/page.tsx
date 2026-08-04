import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Política de tratamiento de datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="rounded-md border border-dashed p-3 text-xs">
            Texto de referencia, no es un documento legal. Antes de operar con usuarios reales,
            reemplázalo por una política redactada o revisada por un abogado, conforme a la Ley
            1581 de 2012 (Colombia) y demás normativa aplicable en tu jurisdicción.
          </p>
          <p>
            PawConnect recolecta el nombre, correo electrónico y teléfono (opcional) que
            proporcionas al registrarte, con el único fin de operar la plataforma: identificar tu
            cuenta, permitir el contacto entre adoptantes y fundaciones, y darle seguimiento a las
            solicitudes de adopción.
          </p>
          <p>
            No compartimos tus datos con terceros distintos de los necesarios para operar el
            servicio (por ejemplo, el proveedor de almacenamiento de imágenes).
          </p>
          <p>
            Puedes actualizar tus datos desde tu perfil en cualquier momento, y solicitar la
            eliminación de tu cuenta desde la sección &quot;Eliminar cuenta&quot; en tu perfil. Al
            eliminarla, tu nombre, correo y teléfono se anonimizan de forma permanente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

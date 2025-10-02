"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/lib/auth"
import { LogOut, Mail, UserIcon } from "lucide-react"

export function ProfileContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Perfil</h1>
          <p className="text-muted-foreground">Gestiona la configuración de tu cuenta</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuario"} />
                <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{user.displayName || "Usuario"}</h3>
                <p className="text-sm text-muted-foreground">
                  Miembro desde {new Date(user.metadata.creationTime || "").toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium text-foreground">{user.displayName || "No establecido"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="destructive" className="w-full h-12" size="lg">
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">GastosApp PWA</p>
            <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
            <p className="text-xs text-muted-foreground">Desarrollado con Next.js y Firebase</p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}

"use client"

import { useAuth } from "@/components/auth-provider"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UnifiedHeader } from "@/components/unified-header"
import { signOut } from "@/lib/auth"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

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
      console.error("Error signing out:", error)
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
    <div className="min-h-screen gradient-bg pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <UnifiedHeader 
          title="Perfil"
          subtitle="Gestiona la configuración de tu cuenta"
          showSummary={false}
        />

        {/* User Info Card Moderna */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-lg animate-bounce-gentle">
                👤
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Información de la Cuenta
                </h3>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuario"} />
                <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white text-xl">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold text-foreground">{user.displayName || "Usuario"}</h3>
                <p className="text-sm text-muted-foreground">
                  Miembro desde {new Date(user.metadata.creationTime || "").toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                  👤
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-bold text-foreground">{user.displayName || "No establecido"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm">
                  📧
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                  <p className="font-bold text-foreground">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card Moderna */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 via-orange-50/50 to-yellow-50/50 dark:from-red-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center text-lg animate-bounce-gentle">
                ⚙️
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Acciones
                </h3>
              </div>
            </div>
            <Button 
              onClick={handleSignOut} 
              className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
              size="lg"
            >
              <LogOut className="w-5 h-5 mr-2" />
              🚪 Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* App Info Moderna */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-rose-900/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-3 animate-pulse-glow">
              📱
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              GastosApp PWA
            </h3>
            <p className="text-sm text-muted-foreground">Versión 1.0.0</p>
            <p className="text-xs text-muted-foreground">Desarrollado con Next.js y Firebase</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

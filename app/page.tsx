import { AuthProvider } from "@/components/auth-provider"
import { LoginPage } from "@/components/login-page"

export default function Home() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4 space-y-4">
          <LoginPage />
        </div>
      </div>
    </AuthProvider>
  )
}

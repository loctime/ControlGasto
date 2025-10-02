import { AuthProvider } from "@/components/auth-provider"
import { LoginPage } from "@/components/login-page"

export default function Home() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  )
}

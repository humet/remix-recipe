import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="glass rounded-3xl p-8 max-w-sm text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We've sent you a confirmation link. Please check your email to verify your account.
        </p>
        <Link href="/auth/login">
          <Button className="w-full h-12 rounded-xl glass border-0">
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  )
}

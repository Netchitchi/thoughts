import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail } from 'lucide-react';
import Link from "next/link"

export default function CheckEmail() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex flex-col items-center justify-center gap-4"> 
          <div className="bg-primary/10 rounded-full p-6">
            <Mail className="h-6 w-6 text-primary"/>
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription>Enviamos um link de confirmação para o seu email. Clique no link para ativar sua conta e começar a usar o Thoughts.</CardDescription>
        </div>
        
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">Não recebeu o email? <Link href="/auth/sign-up" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"> Tentar novamente  </Link></p>
      </CardContent>
    </Card>
  );
}

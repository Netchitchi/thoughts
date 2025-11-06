"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormEvent, useState } from "react";
import { supabase } from "@/packages/supabase-client/src/client";
import Link from "next/link";
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log(data)

      if (error) throw error;
      router.push("/feed")
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally{
      setLoading(false)
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicie sessão na sua conta</CardDescription>
        <CardAction>
          <Button variant="link">
            {" "}
            <Link href="/auth/sign-up"> Criar conta</Link>{" "}
          </Button>
        </CardAction>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 ">
              <Label htmlFor="email">Email </Label>
              <Input
                type="email"
                id="email"
                value={email}
                placeholder="Insira o seu email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                required
              />
            </div>

            <div className="grid gap-2 mt-3">
              <Label htmlFor="password_hash">Palavra-passe</Label>
              <Input
                type="password"
                id="password"
                value={password}
                placeholder="Insira a sua palavra-passe"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
              />
            </div>
          </div>
        </CardContent>
        {error && <div className="mt-1 text-sm text-center text-destructive bg-destructive/10"> {error} </div>}
        <CardFooter>
          <Button type="submit" className="w-full mt-6" disabled={loading}>
            { loading ? "Entrando..." : "Continuar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

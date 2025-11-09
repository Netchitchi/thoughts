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
import { supabase } from "@/packages/supabase-client/src/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import bcrypt from "bcryptjs";
import { FormEvent, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)

    if (confirmPass !== password) {
      setError("As palvras passe são diferentes, faça a alteração");
      setConfirmPass(" ")
      setPassword(" ")
      setIsLoading(false)
      return;
    }
    if (!email || !password || !confirmPass) {
      setError("Preencha os campos vazios");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_REDIRECT ||
            `${window.location.origin}/userLogado`,
          data: {
            name: name,
            email: email,
            bio: "Novo escritor",
            avatar_url:
              "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXItcm91bmQtaWNvbiBsdWNpZGUtdXNlci1yb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI1Ii8+PHBhdGggZD0iTTIwIDIxYTggOCAwIDAgMC0xNiAwIi8+PC9zdmc+",
          },
        },
      });

      if (error) throw error
      
      console.log(data);
      router.push("/onboarding");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Junte-se à comunidade de escritores e leitores
        </CardDescription>
        <CardAction>
          <Button variant="link">
            {" "}
            <Link href="/auth/login"> Iniciar sessão </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="name">Name </Label>
              <Input
                type="name"
                id="name"
                value={name}
                placeholder="Insira o seu email"
                onChange={(e) => {
                  setName(e.target.value);
                }}
                required
              />
            </div>

            <div className="grid gap-2">
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

            <div className="grid gap-2">
              <Label htmlFor="password">Palavra-passe</Label>
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

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirme a palavra-passe</Label>
              <Input
                type="password"
                id="confirm-password"
                value={confirmPass}
                placeholder="Confirme a palavra-passe"
                onChange={(e) => {
                  setConfirmPass(e.target.value);
                }}
                required
              />
            </div>
          </div>
        </CardContent>
        {error && <div className="mt-1 text-center text-sm bg-destructive/10 text-destructive"> {error} </div>}
        <CardFooter className="mt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "A criar conta..." : "Cadastrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

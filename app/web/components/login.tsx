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
import bcrypt from "bcryptjs";
import { Users } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!email || !password){
      return
    }

    const {data: user, error} = await supabase
      .from('users')
      .select('*')
      .eq("email", email)

    if(error || !user){
      alert("Nenhum usuário encontrado")
      return
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

  };

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicie sessão na sua conta</CardDescription>
        <CardAction>
          <Button variant="link">Criar conta</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email </Label>
              <Input
                type="text"
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
              <Label>Palavra-passe</Label>
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
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </CardFooter>
    </Card>
  );
}

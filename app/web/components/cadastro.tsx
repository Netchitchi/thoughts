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

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password_hash, setPassword_hash] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirmPass !== password_hash) {
      alert("palavras-passe diferentes");
      return;
    }
    if (!email || !password_hash || !confirmPass) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name,email, password_hash: hashedPassword }])
      .select();

    if (error) {
      console.error(error);
      alert("Erro ao criar conta");
      return;
    }

    console.log("Usuário criado:", data);
  };

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Cadastro</CardTitle>
        <CardDescription>Crie a sua conta</CardDescription>
        <CardAction>
          <Button variant="link">Iniciar sessão</Button>
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
              <Label htmlFor="password_hash">Palavra-passe</Label>
              <Input
                type="password"
                id="password_hash"
                value={password_hash}
                placeholder="Insira a sua palavra-passe"
                onChange={(e) => {
                  setPassword_hash(e.target.value);
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

        <CardFooter>
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

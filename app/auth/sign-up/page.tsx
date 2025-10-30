import Cadastro from "@/components/meusComponetes/cadastro";
import { PenLine } from "lucide-react";
import Link from "next/link";


export default function SignUpPage(){

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary p-6">
      <div className="w-full max-w-md">
        <Link href="/">
          <div className="flex flex-row justify-center gap-2 mb-8">
            <PenLine className="h-8 w-8"/>
            <span className="text-2xl font-semibold"> Thoughts</span>
          </div>
        </Link>
        <Cadastro  />
      </div>
    </div>

  )
}
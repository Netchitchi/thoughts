import Login from "@/components/meusComponetes/login";
import { PenLine } from "lucide-react";
import Link from "next/link";

export default function LoginPage(){


  return(
    <div className="flex w-full justify-center items-center min-h-screen bg-secondary p-6">
    <div className="w-full max-w-md">
      <Link href="/">
        <div className="flex flex-row justify-center items-center mb-8 gap-2">
        <PenLine className="h-8 w-8"/>
        <span className=" text-2xl font-semibold "> Thoughts</span>
        </div>
      </Link>
      <Login />
    </div>
  </div>
  )
}
import CheckEmail from "@/components/meusComponetes/checkEmail"
import { PenLine } from "lucide-react"

export default function Email (){

  return(
    <div className="flex w-full min-h-screen justify-center items-center bg-secondary p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-row justify-center gap-2 mb-8">
          <PenLine className="h-8 w-8"/>
          <span className="text-2xl font-semibold"> Thoughts</span>
        </div>
        <CheckEmail />
      </div>
    </div>
  )

}
import Cadastro from "../components/cadastro";
import Login from "../components/login";
import Navbar from "../components/navbar";


export default function HomePage(){

  return(
    <main>
      <div>
        <Navbar/>
      </div>
      
      <div className="mt-16">
         <Login />
         <Cadastro />
      </div>
      
    </main>
  )
}
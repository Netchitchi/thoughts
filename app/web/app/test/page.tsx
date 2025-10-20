import { supabase } from "@thoughts/supabase-client/client";


export default async function TestPage() {
  const { data, error } = await supabase.from("users").select("*");

  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <h1>Artigos</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      { data && data.map((user: any) => (
        <p key={user.id}> {user.name ?? "unamed"}</p>
      ) )}
    </div>
  );
}

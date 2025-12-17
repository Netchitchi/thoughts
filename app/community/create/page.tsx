import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGroupForm } from "@/components/community/CreateGroupForm";

export default function CreateGroupPage() {
  return (
    <div className="flex-1 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}

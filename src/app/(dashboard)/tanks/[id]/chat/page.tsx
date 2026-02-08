import { ChatContainer } from "@/components/chat/chat-container";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tank } = await supabase
    .from("tanks")
    .select("name")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  return {
    title: tank ? `Chat - ${tank.name}` : "Chat - AquaBotAI",
  };
}

export default async function TankChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify tank ownership
  const { data: tank, error } = await supabase
    .from("tanks")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (error || !tank) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatContainer tankId={tank.id} showTankSwitcher={false} />
    </div>
  );
}

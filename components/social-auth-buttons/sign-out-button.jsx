import { supabase } from "@/lib/supabase";
import { Button } from "react-native";

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
  }
}

export default function SignOutButton() {
  return (
    <Button title="Abmelden" color="#dc2626" onPress={onSignOutButtonPress} />
  );
}

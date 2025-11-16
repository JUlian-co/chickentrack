import { AuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { profiles } from "@/configs/db/schema";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState();
  const [profile, setProfile] = useState();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the session once, and subscribe to auth state changes
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      }

      setSession(session);
      setIsLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", { event: _event, session });
      setSession(session);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch the profile when the session changes
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);

      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!data) {
          /* console.log(
            "                                                                                                         "
          );
          console.log(session.user.user_metadata.full_name);
          console.log(session.user.id);
          console.log(session.user.email);
          console.log(
            "                                                                                                         "
          ); */
          const { data, error } = await supabase
            .from("profiles") // <- Tabellenname als String (muss dem Schema entsprechen)
            .insert([
              // <- Supabase erwartet hier ein Array von Objekten
              {
                username: session.user.user_metadata.full_name,
                id: session.user.id,
                email: session.user.email,
              },
            ])
            .select(); // Optional: Damit bekommst du die eingefügten Daten zurück

          if (error) {
            // Fehlerbehandlung hier (wichtig bei Remote-APIs!)
            console.error("Fehler beim Einfügen des Profils:", error.message);
          }
          console.log("DATA: ", data);
          setProfile(data[0]);
          return;
        } else if (data) {
          console.log("IN ELSE IF");
          setProfile(data);
        }

        console.log(
          "DATA IN PROVIDER: ",
          session.user.id,
          data,
          session,
          "   SPACE    ",
          session.user
        );
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    };

    fetchProfile();
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        profile,
        isLoggedIn: session != undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

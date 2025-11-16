import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthContext } from "@/hooks/use-auth-context";
import { Back } from "../../components";

export default function TruckSettingsScreen() {
  const { profile } = useAuthContext();

  return (
    <SafeAreaView className=" bg-main w-full p-4 flex-1">
      <Back parent={"settings"} name={"Profil"} />
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      ></ScrollView>
    </SafeAreaView>
  );
}

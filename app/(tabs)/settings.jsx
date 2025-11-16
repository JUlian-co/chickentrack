import React from "react";
import { ArrowRight, CircleUserRound, Heart, Truck } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import SignOutButton from "@/components/social-auth-buttons/sign-out-button";

const options = [
  {
    title: "Profil",
    icon: <CircleUserRound size={20} />,
    link: "/settings/profile",
  },
  {
    title: "Deine Wägen",
    icon: <Truck size={20} />,
    link: "/settings/truck",
  },
  {
    title: "Favoriten",
    icon: <Heart size={20} />,
    link: "/settings/favorites",
  },
];

export default function SettingsScreen() {
  const { profile } = useAuthContext();

  return (
    <SafeAreaView className=" bg-main w-full p-4 flex-1">
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      >
        <View>
          <View className="mb-6">
            <Text className="text-xl font-semibold">
              Willkommen, {profile.username}
            </Text>
            <Text className="text-gray-600">{profile.email}</Text>
          </View>
          {/* In profiles page von den settings anzeigen */}

          <View>
            {options.map((option, index) => (
              <Link
                key={index}
                className="p-2 bg-black/10 rounded-lg mb-4 flex flex-row items-center justify-center"
                href={option.link}
              >
                <View className="flex flex-row items-center justify-between w-full">
                  <View className="flex flex-row items-center gap-2">
                    {option.icon}
                    <Text>{option.title}</Text>
                  </View>

                  <ArrowRight size={16} />
                </View>
              </Link>
            ))}
          </View>
        </View>

        {/*  <Link href="/(tabs)" className="">
          Hiii
          </Link> */}

        <SignOutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

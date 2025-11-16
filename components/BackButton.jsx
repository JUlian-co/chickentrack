import { Link } from "expo-router";
import { ArrowLeft, ChevronLeft } from "lucide-react-native";
import { Text, View } from "react-native";

const parents = {
  settings: "/(tabs)/settings",
};

export default function Back({ parent, name }) {
  return (
    <View className="mb8 fixed top-0 flex flex-row items-center justify-between w-full py-2">
      <Link
        href={parents[parent]}
        className="flex flex-row  items-center justify-center"
      >
        <ChevronLeft size={24} />
      </Link>

      <Text className="text-lg">{name}</Text>
    </View>
  );
}

{
  /* <Link href={parents[parent]} className="mb8 fixed top-0">
  <ArrowLeft />
</Link> */
}

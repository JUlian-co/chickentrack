import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  FlatList,
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
import { Heart } from "lucide-react-native";
import { useChickenTrucks } from "../../hooks/useChickenTrucks";

export default function TruckSettingsScreen() {
  const { profile } = useAuthContext();
  const { trucks, setTrucks, favoriteTruck } = useChickenTrucks();
  console.log("trucks in stupdid shit settings page: ", trucks);

  const TruckCard = ({ item, favoriteTruck }) => {
    setTrucks(
      trucks.filter((truck) => {
        if (truck.favorite) {
          return truck;
        }

        return null;
      })
    );
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0].source : null;

    const avgStars = Number(item.avgStars) || 0;
    console.log(item);
    const fullWidth = 100;
    let starWidth = 0;
    if (avgStars == 0) {
      starWidth = 0;
    } else {
      starWidth = (avgStars / 5) * fullWidth;
    }
    console.log("item.favorite", item.favorite);

    return (
      <View
        style={{ marginRight: 8, height: 200 }} // feste Höhe nötig, sonst sind Bilder 0px hoch
        className="relative bg-main rounded-lg shadow-xl overflow-hidden w-full mb-4"
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        <View className="absolute top-0 left-0 p-2 w-full flex flex-row items-center justify-between">
          <View
            style={{ width: starWidth }}
            className={`flex flex-row items-center justify-start overflow-hidden`}
          >
            <Text style={{ width: fullWidth }}>⭐️⭐️⭐️⭐️⭐️</Text>
          </View>

          <TouchableOpacity
            onPress={() => favoriteTruck && favoriteTruck(item)}
          >
            {item.favorite ? (
              <Heart color={"#ff35c9"} size={24} fill={"#ff35c9"} />
            ) : (
              <Heart color={"#ff35c9"} size={24} />
            )}
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-0 left-0 bg-main/50 w-full p-2">
          <Text className="font-semibold">{item.name}</Text>
          <Text>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className=" bg-main w-full p-4 flex-1">
      <Back parent={"settings"} name={"Favoriten"} />
      {/* <ScrollView className="w-full" contentContainerStyle={{ flexGrow: 1 }}> */}
      <FlatList
        data={trucks}
        renderItem={({ item }) => (
          <TruckCard item={item} favoriteTruck={favoriteTruck} />
        )}
        keyExtractor={(item, idx) =>
          item?.id ? item.id.toString() : `id-${idx}`
        }
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
      {/* </ScrollView> */}
    </SafeAreaView>
  );
}

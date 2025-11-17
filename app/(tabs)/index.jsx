import React, { useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";
import SignOutButton from "@/components/social-auth-buttons/sign-out-button";
import { Heart } from "lucide-react-native";
import { useAuthContext } from "@/hooks/use-auth-context";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_GAP = 16;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;

export default function HomeScreen() {
  const { profile } = useAuthContext();
  console.log(
    "------------------------------------------------Profile-----------: ",
    profile
  );
  const [trucks, setTrucks] = useState([]);
  console.log("trucks under trucks state: ", trucks);
  const [location, setLocation] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef(null);
  const mapRef = useRef(null);

  const fetchTrucksAndRelated = async () => {
    if (!profile || !profile.id) {
      console.log(
        "Warten auf Benutzer- oder Truck-Daten... Abfrage übersprungen."
      );
      return;
    }

    const { data: trucksData, error: trucksError } = await supabase
      .from("trucks")
      .select("*");

    if (trucksError) {
      console.error("Fehler beim Laden der Trucks:", trucksError);
      return;
    }

    console.log("Trucks geladen:", trucksData);

    const trucksWithRelatedPromises = trucksData.map(async (truck) => {
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("truck_id", truck.id);

      console.log("images from new useeffect func: ", imagesData);

      if (imagesError) {
        console.error(
          `Fehler beim Laden der Bilder für Truck ${truck.id}:`,
          imagesError
        );
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("truck_id", truck.id);

      console.log("reviews from new useeffect func: ", reviewsData);

      if (reviewsError) {
        console.error(
          `Fehler beim Laden der Reviews für Truck ${truck.id}:`,
          reviewsError
        );
        return { ...truck, images: [], reviews: [] };
      }

      const avgStars = await getAvgStars(reviewsData);

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("id")
        .eq("truck_id", truck.id)
        .eq("user_id", profile.id);

      console.log("favorites from new useeffect func: ", favoritesData);

      if (favoritesError) {
        console.error(`Error while fetching favorites:`, favoritesError);
      }

      return {
        ...truck,
        images: imagesData,
        reviews: reviewsData,
        favorite: favoritesData[0]?.id ? true : false,
        avgStars,
      };
    });

    const trucksWithRelated = await Promise.all(trucksWithRelatedPromises);
    setTrucks((prevTrucks) => [...prevTrucks, ...trucksWithRelated]);

    console.log("Vollständige Truck-Daten mit Bildern:", trucksWithRelated);
  };

  useEffect(() => {
    const fetchTrucks = async () => {
      const { data } = await supabase.from("trucks").select("*");
      console.log("data: ", data);
      setTrucks(data);
      console.log("trucks: ", trucks);
    };

    // fetchTrucks();
    fetchTrucksAndRelated();
  }, [profile]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      console.log("LOC: ", loc.coords);
      setLocation({
        ...loc.coords,
        latitudeDelta: 0.075,
        longitudeDelta: 0.025,
      });
    })();
  }, []);

  const favoriteTruck = async (truck) => {
    console.log("truck in favor truck: ", truck);
    //   {
    //   avgStars: 0,
    //   created_at: "2025-11-14T15:46:59.535713",
    //   description: "",
    //   id: "1b7ef971-cc53-4a3c-9836-5ca7db4cf692",
    //   images: [
    //     {
    //       created_at: "2025-11-14T15:47:02.924553",
    //       id: "5320cafb-4ea1-407b-8075-2861a742fd20",
    //       source:
    //         "https://vvklrsdxblmrlovunsde.supabase.co/storage/v1/object/public/images/public/ChickenTrack_1763135220590.jpg",
    //       truck_id: "1b7ef971-cc53-4a3c-9836-5ca7db4cf692",
    //       uploader_id: "95e4f570-c807-4100-9ace-4550377ad391",
    //     },
    //   ],
    //   latitude: 51.47512025164441,
    //   longitude: -0.14143450650237957,
    //   name: "Ich",
    //   owner_email: "gsproduction.juli@gmail.com",
    //   owner_id: "95e4f570-c807-4100-9ace-4550377ad391",
    //   reviews: [],
    // }

    const { data, error } = await supabase
      .from("favorites")
      .insert([{ truck_id: truck.id, user_id: profile.id }])
      .select();

    console.log("data in favor truck: ", data);

    if (error) {
      console.error("error when favoriting truck: ", error);
    }
  };

  const moveMapToTruck = (truck) => {
    if (mapRef.current && truck) {
      const newRegion = {
        latitude: truck.latitude,
        longitude: truck.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapRef.current.animateToRegion(newRegion);
    }
  };

  const renderTruckCard = ({ item }) => {
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0].source : null;

    const avgStars = Number(item.avgStars) || 0;
    console.log(item);
    console.log("avg stars for rednering: ", avgStars);
    const fullWidth = 100;
    let starWidth = 0;
    if (avgStars == 0) {
      starWidth = 0;
    } else {
      starWidth = (avgStars / 5) * fullWidth;
    }
    console.log("starwidth: ", starWidth);

    return (
      <View
        style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
        className="relative bg-main rounded-lg shadow-xl overflow-hidden"
        key={item.id}
      >
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />

        <View className="absolute top-0 left-0 p-2 w-full flex flex-row items-center justify-between">
          <View
            style={{ width: starWidth }}
            className={`flex flex-row items-center justify-start overflow-hidden`}
          >
            <Text style={{ width: fullWidth }}>⭐️⭐️⭐️⭐️⭐️</Text>
          </View>

          <TouchableOpacity onPress={() => favoriteTruck(item)}>
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

  const getAvgStars = async (reviews) => {
    console.log("reviews in avg stars: ", reviews);

    let totalStars = 0;
    await reviews.map((review) => {
      console.log("review: ", review);
      totalStars += Number(review.stars);
      console.log("stars in map: ", totalStars);
    });

    console.log("avg stars: ", totalStars / reviews.length);
    return totalStars / Number(reviews.length) || 0;
  };

  return (
    <View className="flex-1">
      <MapView
        style={styles.map}
        showsUserLocation={true}
        mapType="mutedStandard"
        region={location || { latitude: 46, longitude: 9 }}
        ref={mapRef}
      >
        {trucks.map((truck, index) => (
          <Marker
            key={index}
            image={require("../../assets/images/MarkerD.png")} /* TODO: wir müssen mit anchor arbeiten und das bild so klein wie möglich halten, also man soll nicht auf was leeres klicken können damit ein marker ausgewählt wird */
            coordinate={{
              latitude: truck.latitude,
              longitude: truck.longitude,
            }}
            title={truck.name}
            description={truck.description}
          />
        ))}
      </MapView>

      <View className="absolute bottom-4 left-0 right-0  h-56">
        <FlatList
          ref={flatListRef}
          data={trucks}
          renderItem={renderTruckCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: CARD_GAP / 2 }}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_SIZE);
            if (index !== activeIndex) {
              setActiveIndex(index);
              moveMapToTruck(trucks[index]);
              console.log("active index in flatlist onscroll: ", activeIndex);
            }
          }}
          scrollEventThrottle={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});

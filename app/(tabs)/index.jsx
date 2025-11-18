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
  const [trucks, setTrucks] = useState([]);
  // console.log("trucks under trucks state: ", trucks);
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

    setTrucks([]);

    const { data: trucksData, error: trucksError } = await supabase
      .from("trucks")
      .select("*");

    if (trucksError) {
      console.error("Fehler beim Laden der Trucks:", trucksError);
      return;
    }

    // console.log("Trucks geladen:", trucksData);

    const trucksWithRelatedPromises = trucksData.map(async (truck) => {
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("truck_id", truck.id);

      // console.log("images from new useeffect func: ", imagesData);

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

      // console.log("reviews from new useeffect func: ", reviewsData);

      if (reviewsError) {
        console.error(
          `Fehler beim Laden der Reviews für Truck ${truck.id}:`,
          reviewsError
        );
        return { ...truck, images: [], reviews: [] };
      }

      // Stellen Sie sicher, dass getAvgStars korrekt definiert ist und funktioniert
      const avgStars = await getAvgStars(reviewsData);

      const { data: favoritesData, error: favoritesError } = await supabase
        .from("favorites")
        .select("id")
        .eq("truck_id", truck.id)
        .eq("user_id", profile.id);

      // console.log("favorites from new useeffect func: ", favoritesData);

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
    setTrucks((prevTrucks) => {
      // Ein Set verwenden, um schnell alle IDs der bereits existierenden Trucks zu sammeln
      const existingTruckIds = new Set(prevTrucks.map((truck) => truck.id));

      // Filtern Sie die neu geladenen Trucks, um nur die hinzuzufügen, die noch nicht existieren
      const newUniqueTrucks = trucksWithRelated.filter(
        (truck) => !existingTruckIds.has(truck.id)
      );

      // Das neue, kombinierte Array zurückgeben
      return [...newUniqueTrucks];
    });
    // setTrucks(trucksWithRelated);
    // Anstelle von: setTrucks((prevTrucks) => [...prevTrucks, ...trucksWithRelated]);

    // console.log("Vollständige Truck-Daten mit Bildern:", trucksWithRelated);
  };

  useEffect(() => {
    fetchTrucksAndRelated();
  }, [profile?.id]);

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
    const favorite = truck.favorite;

    setTrucks((prevTrucks) => {
      return prevTrucks.map((t) => {
        // Prüfen, ob die ID übereinstimmt
        if (truck.id === t.id) {
          // Ein NEUES Truck-Objekt mit dem aktualisierten 'favorite'-Status zurückgeben
          return { ...t, favorite: !t.favorite };
        }
        return t; // KORRIGIERT: Den aktuellen Truck 't' zurückgeben
      });
    });

    if (favorite) {
      /* truck favorited, so unfavorite it */
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("truck_id", truck.id)
        .eq("user_id", profile.id);

      if (error) {
        console.error("error when removing favorite truck: ", error);
      }
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .insert([{ truck_id: truck.id, user_id: profile.id }])
      .select();

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
    console.log("item.favorite", item.favorite);

    return (
      <View
        style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
        className="relative bg-main rounded-lg shadow-xl overflow-hidden"
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
              if (trucks[index]) {
                moveMapToTruck(trucks[index]);
              }
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

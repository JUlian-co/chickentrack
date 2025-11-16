import React, { useEffect, useRef, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  Image,
  Text,
} from "react-native";
import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_GAP = 16;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;

export default function HomeScreen() {
  const [trucks, setTrucks] = useState([]);
  console.log("trucks under trucks state: ", trucks);
  const [location, setLocation] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef(null);
  const mapRef = useRef(null);

  const fetchTrucksAndRelated = async () => {
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
      return {
        ...truck,
        images: imagesData,
        reviews: reviewsData,
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
  }, []);

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

        <View className="absolute top-0 left-0 p-2">
          <View
            style={{ width: starWidth }}
            className={`flex flex-row items-center justify-start overflow-hidden`}
          >
            <Text style={{ width: fullWidth }}>⭐️⭐️⭐️⭐️⭐️</Text>
          </View>
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

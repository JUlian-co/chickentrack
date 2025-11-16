import React, { useEffect, useState } from "react";
import MapView, { Marker } from "react-native-maps";

import * as Location from "expo-location";
import { ArrowLeft, ArrowRight, CircleUserRound, X } from "lucide-react-native";
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
import { Link } from "expo-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { Back } from "../../components";

export default function TruckSettingsScreen() {
  const { profile } = useAuthContext();
  const [creatingTruck, setCreatingTruck] = useState(false);
  const [location, setLocation] = useState(null);
  const [truck, setTruck] = useState({
    name: "Dein Hähnchenwagen",
    desc: "",
    lat: "46",
    lng: "9",
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
    /* Lugano, Switzerland (Beautiful city ❤️) */
  });
  console.log("TRUCK: ", truck);
  const [trucks, setTrucks] = useState([]);
  const [image, setImage] = useState([]); /* local uri */
  console.log("images in root: ", image);

  const fetchTrucksAndRelated = async () => {
    const { data: trucksData, error: trucksError } = await supabase
      .from("trucks")
      .select("*")
      .eq("owner_id", profile.id);

    if (trucksError) {
      console.error("Fehler beim Laden der Trucks:", trucksError);
      return;
    }

    const trucksWithRelatedPromises = trucksData.map(async (truck) => {
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*") // Wählt alle Spalten aus (z.B. die URL des Bildes)
        .eq("truck_id", truck.id);

      console.log("images from new useeffect func: ", imagesData);

      if (imagesError) {
        console.error(
          `Fehler beim Laden der Bilder für Truck ${truck.id}:`,
          imagesError
        );
        // Im Fehlerfall geben wir den Truck ohne Bilder zurück, um den Prozess nicht zu stoppen
        return { ...truck, images: [] };
      }

      // Kombinieren Sie die Bilder mit den Truck-Daten
      return {
        ...truck,
        images: imagesData,
      };
    });

    // 3. Warten, bis ALLE Bildabfragen abgeschlossen sind
    const trucksWithRelated = await Promise.all(trucksWithRelatedPromises);

    // 4. Den Zustand einmal mit den vollständigen Daten aktualisieren
    // Da Sie 'props => [...props, ...]' in Ihrem Originalcode hatten,
    // gehe ich davon aus, dass Sie die neuen Trucks zu einer bestehenden Liste hinzufügen wollen.
    setTrucks((prevTrucks) => [...prevTrucks, ...trucksWithRelated]);

    console.log("Vollständige Truck-Daten mit Bildern:", trucksWithRelated);
  };

  useEffect(() => {
    const fetchTrucks = async () => {
      const { data } = await supabase
        .from("trucks")
        .select("*")
        .eq("owner_id", profile.id);

      console.log("trucks in useEffect: ", data);

      setTrucks(data);
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
        latitudeDelta: 0.0001,
        longitudeDelta: 0.001,
      });
      setTruck((props) => ({
        ...props,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      }));
    })();
  }, []);

  const createTruck = async () => {
    const { data, error } = await supabase
      .from("trucks")
      .insert([
        {
          name: truck.name,
          description: truck.desc,
          owner_id: profile.id,
          owner_email: profile.email,
          latitude: truck.lat,
          longitude: truck.lng,
        },
      ])
      .select();

    if (error) {
      console.error(error);
      alert("Etwas is scheifgegangen."); /* TODO: add toasts */
    }

    console.log("data in createTruck: ", data);

    await saveImageInDb(data[0].id);

    setImage([]);
    setCreatingTruck(false);
  };

  const saveImageInDb = async (truckId) => {
    console.log("image in saveImageInDb: ", image);
    console.log("truckId in saveImageInDb: ", truckId);

    image.map(async (img, index) => {
      console.log("image in in map: ", img, index);
      const path = await uploadImage(img);
      const url = await getPublicUrl(path);

      const { error } = await supabase.from("images").insert([
        {
          source: url,
          uploader_id: profile.id,
          truck_id: truckId,
        },
      ]);

      if (error) {
        console.error("error while saving image urls in db: ", error);
      }
    });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [16, 9],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImage((props) => [...props, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri) => {
    console.log("!!!!!!!!!!!!!!!image in uploadImage to supabase: ", uri);
    const res = await fetch(uri);
    const blob = await res.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const fileName = `public/ChickenTrack_${profile.email}_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, arrayBuffer, {
        contentType: "image/jpeg",
      });
    if (error) {
      // Handle error
      console.log("error", error);
      return;
    }

    console.log("data in pickImage: ", data);
    return data.path;
  };

  const getPublicUrl = async (path) => {
    const { data, error } = supabase.storage.from("images").getPublicUrl(path);
    if (error) {
      console.error("something went wrong in getPublicUrl(): ", error);
      return;
    }

    console.log("data in getPublicUrl: ", data.publicUrl);
    return data.publicUrl;
  };

  const removeImg = (id) => {
    console.log("index in removeBg: ", id);
    setImage(image.filter((_, index) => index !== id));
    console.log("imgs ind removeimg: ", image);
  };

  return (
    <SafeAreaView className=" bg-main w-full p-4 flex-1">
      <ScrollView
        className="w-full"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
      >
        <Back parent={"settings"} />

        <View className="w-full">
          <View className="w-full flex flex-col items-center mb-6">
            <TouchableHighlight
              className="p-2.5 border-2 border-black rounded-lg w-min justify-center items-center"
              onPress={() => setCreatingTruck(true)}
            >
              <Text className="">+ Neuer Hähnchenwagen</Text>
            </TouchableHighlight>
            <Text className="text-sm text-gray-600">Gratis</Text>
          </View>

          <View className="flex flex-row justify-between items-center w-full mb-2">
            <Text className="text-gray-600">Deine Hähnchenwagen:</Text>
          </View>
          <View>
            {trucks.length > 0 && (
              <>
                {trucks.map((truck, index) => {
                  console.log(
                    "truck obj in map in rendering: ",
                    truck.images[0].source
                  );

                  const src = truck.images[0].source;
                  console.log("src in map: ", src);

                  return (
                    <View
                      key={index}
                      className=" rounded-lg bg-main shadow-md shadow-secondary/20 w-full flex border border-secondary mb-6"
                    >
                      <Image
                        source={{ uri: src }}
                        className="w-full h-[calc((95vw/16)*9)] rounded-lg"
                      />
                      <View className="p-4">
                        <Text className="font-semibold">{truck.name}</Text>
                        <Text className="minidesc">{truck.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {creatingTruck && (
        <View
          // 1. Positionierung: Absolut über dem gesamten Screen
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          {/* 2. Panel-Inhalt: Das zentrierte, sichtbare Fenster */}
          <View className="bg-white rounded-xl shadow-2xl w-11/12 max-w-sm">
            <ScrollView className="w-full h-3/4 flex flex-col p-6 pb-8">
              <View className="w-full justify-between items-center flex flex-row">
                <Text className="text-xl font-bold">Neuen Truck erstellen</Text>
                <TouchableOpacity onPress={() => setCreatingTruck(false)}>
                  <X />
                </TouchableOpacity>
              </View>
              <Text className="text-sm mb-6">* = Pflichfeld</Text>

              <Text className=" h3">Name:*</Text>
              <TextInput
                className="tinput mb-6"
                onChangeText={(e) =>
                  setTruck((props) => ({ ...props, name: e }))
                }
              />

              <Text className="h3">Beschreibung:</Text>
              <TextInput
                className="tinput mb-6"
                onChangeText={(e) =>
                  setTruck((props) => ({ ...props, desc: e }))
                }
              />

              <Text className="text-lg">Setze den Standort:*</Text>
              <Text className=" minidesc mb-2">
                Halte den orangen Pin eine Sekunde gedrückt und ziehe ihn zum
                Standort deines Wagens.
              </Text>
              <MapView
                style={styles.map}
                showsUserLocation={true}
                className=""
                region={location}
              >
                <Marker
                  coordinate={location}
                  draggable
                  image={require("../../assets/images/MarkerE.png")}
                  isPreselected={true}
                  title="Dein Hähnchenwagen"
                  description="Das beste Hähnchen der Stadt!"
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;

                    setTruck((props) => ({
                      ...props,
                      lat: latitude,
                      lng: longitude,
                    }));
                  }}
                ></Marker>
              </MapView>

              <Text className="h3 mt-6">Bilder:</Text>
              <Text className="minidesc ">Seitenverhältnis: 16:9</Text>
              <View style={styles.container}>
                <Button
                  title="Wähle ein Bild aus deiner Mediathek"
                  onPress={pickImage}
                />
                <ScrollView
                  horizontal={true}
                  className="h-min w-full"
                  contentContainerStyle={{ gap: 8 }}
                  showsHorizontalScrollIndicator={false}
                >
                  {image &&
                    image.map((img, index) => (
                      <View
                        key={index}
                        className="relative w-80 h-[calc((95vw/16)*9)] rounded-lg overflow-hidden"
                      >
                        <Image
                          source={{ uri: img }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />

                        <TouchableOpacity
                          onPress={() => removeImg(index)}
                          className="absolute top-2 right-2 bg-red-600/80 p-1 rounded-full shadow-lg"
                        >
                          <X color={"#ffffff"} size={16} />
                        </TouchableOpacity>
                      </View>
                    ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={() => createTruck()}
                className=" my-6 bg-accent p-3 rounded-lg "
              >
                <Text className="text-white text-center text-lg">Fertig</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "256",
  },
  container: {
    flex: 1,
    alignItems: "start",
    justifyContent: "center",
  },
  image: {
    width: 400,
    height: 233,
  },
});

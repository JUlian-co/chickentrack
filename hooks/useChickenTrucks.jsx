import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/hooks/use-auth-context";

export function useChickenTrucks() {
  const { profile } = useAuthContext();
  const [trucks, setTrucks] = useState([]);
  const [favoriteTrucks, setFavoriteTrucks] = useState([]);

  const fetchTrucksAndRelated = async () => {
    if (!profile || !profile.id) {
      console.log(
        "Warten auf Benutzer- oder Truck-Daten... Abfrage übersprungen."
      );
      return;
    }

    // setTrucks([]);

    const { data: trucksData, error: trucksError } = await supabase
      .from("trucks")
      .select("*");

    if (trucksError) {
      console.error("Fehler beim Laden der Trucks:", trucksError);
      return;
    }

    console.log(
      "Trucks geladen999999999999999999999999999999999999999999^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^:",
      trucksData
    );

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

    setFavoriteTrucks(
      trucksWithRelated.filter((truck) => {
        if (truck.favorite) return truck;
      })
    );
  };

  const getAvgStars = async (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    console.log("reviews in avg stars: ", reviews);

    let totalStars = 0;
    reviews.map((review) => {
      console.log("review: ", review);
      totalStars += Number(review.stars);
      console.log("stars in map: ", totalStars);
    });

    console.log("avg stars: ", totalStars / reviews.length);
    return totalStars / Number(reviews.length) || 0;
  };

  const favoriteTruck = async (truck) => {
    const favorite = truck.favorite;

    setTrucks((prevTrucks) => {
      return prevTrucks.map((t) => {
        if (truck.id === t.id) {
          return { ...t, favorite: !t.favorite };
        }
        return t;
      });
    });

    if (favorite) {
      /* truck favorited, so unfavorite it */

      setFavoriteTrucks(
        favoriteTrucks.filter((t) => {
          if (t.id != truck.id) return truck;
        })
      );

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

  useEffect(() => {
    fetchTrucksAndRelated();
  }, [profile?.id]);

  if (trucks) {
    console.log(
      "trucks in last if #++#+#+#+++#+#+#+#+#++#+#+#+#+#+#+#+#+#+##+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#+#++#+##+#+#+#++#+#+##+#+#++##++#+#+#",
      trucks
    );
    return { trucks, setTrucks, favoriteTruck, favoriteTrucks };
  }
}

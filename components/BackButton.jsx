import { Link } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

const parents = {
  settings: "/(tabs)/settings",
};

export default function Back({ parent }) {
  return (
    <Link href={parents[parent]} className="mb-8">
      <ArrowLeft />
    </Link>
  );
}

import { applyAppearance, readAppearance } from "./src/appearance/appearanceSettings";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { loadFonts } from "./src/styles/fonts";
import "./src/styles/global.css";

loadFonts();
applyAppearance(readAppearance());

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

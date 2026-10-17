import { useState } from "react";

import { clearSharedUsername, readSharedUsername } from "../linking/sharedProfile";
import HomeScreen from "../screens/HomeScreen";
import MyQrCodeScreen from "../screens/MyQrCodeScreen";
import ProfileScreen from "../screens/ProfileScreen";

type AppPage = { name: "home" } | { name: "myQrCode" } | { name: "profile"; username: string };

function getInitialPage(): AppPage {
  const sharedUsername = readSharedUsername();
  return sharedUsername ? { name: "profile", username: sharedUsername } : { name: "home" };
}

export default function AppNavigator() {
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);

  function showHome() {
    clearSharedUsername();
    setCurrentPage({ name: "home" });
  }

  if (currentPage.name === "myQrCode") {
    return <MyQrCodeScreen onBack={showHome} />;
  }

  if (currentPage.name === "profile") {
    return <ProfileScreen username={currentPage.username} onBack={showHome} />;
  }

  return (
    <HomeScreen
      onShowMyQrCode={() => setCurrentPage({ name: "myQrCode" })}
      onFindProfile={(username) => setCurrentPage({ name: "profile", username })}
    />
  );
}

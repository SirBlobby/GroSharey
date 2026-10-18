import { useState } from "react";

import CardScreen from "../components/CardScreen";
import { useAuth } from "../hooks/useAuth";
import { useFriends } from "../hooks/useFriends";
import { useGroceryRun } from "../hooks/useGroceryRun";
import { useReceiptScanner } from "../hooks/useReceiptScanner";
import { clearSharedUsername, readSharedUsername } from "../linking/sharedProfile";
import ConfirmedScreen from "../screens/ConfirmedScreen";
import HomeScreen from "../screens/HomeScreen";
import MainScreen from "../screens/MainScreen";
import ManageItemsScreen from "../screens/ManageItemsScreen";
import MyQrCodeScreen from "../screens/MyQrCodeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ScanReceiptScreen from "../screens/ScanReceiptScreen";
import { convertUserToFriend } from "../services/friends";

type AppPage =
  | { name: "main" }
  | { name: "scan" }
  | { name: "manage" }
  | { name: "confirmed" }
  | { name: "account" }
  | { name: "myQrCode" }
  | { name: "profile"; username: string };

function getInitialPage(): AppPage {
  const sharedUsername = readSharedUsername();
  return sharedUsername ? { name: "profile", username: sharedUsername } : { name: "main" };
}

export default function AppNavigator() {
  const { currentUser, logOut } = useAuth();
  const friendList = useFriends();
  const groceryRun = useGroceryRun();
  const receiptScanner = useReceiptScanner();
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);

  const assignableFriends = currentUser
    ? [convertUserToFriend(currentUser), ...friendList.friends]
    : friendList.friends;

  function showMain() {
    clearSharedUsername();
    friendList.refreshFriends();
    setCurrentPage({ name: "main" });
  }

  function startScan() {
    receiptScanner.reset();
    setCurrentPage({ name: "scan" });
  }

  function startManualEntry() {
    groceryRun.startManualEntry();
    setCurrentPage({ name: "manage" });
  }

  function leaveManageItems() {
    setCurrentPage({ name: groceryRun.source === "scan" ? "scan" : "main" });
  }

  async function confirmGroceryRun() {
    if (await groceryRun.saveGroceryRun()) {
      setCurrentPage({ name: "confirmed" });
    }
  }

  switch (currentPage.name) {
    case "scan":
      return (
        <ScanReceiptScreen
          scanner={receiptScanner}
          onBack={showMain}
          onConfirm={(scannedReceipt) => {
            groceryRun.loadScannedReceipt(scannedReceipt);
            setCurrentPage({ name: "manage" });
          }}
        />
      );
    case "manage":
      return (
        <ManageItemsScreen
          items={groceryRun.items}
          onItemsChange={groceryRun.setItems}
          receiptDetails={groceryRun.receiptDetails}
          friends={assignableFriends}
          onAddFriend={friendList.addFriend}
          errorMessage={groceryRun.errorMessage}
          isSaving={groceryRun.isSaving}
          onBack={leaveManageItems}
          onConfirm={confirmGroceryRun}
        />
      );
    case "confirmed":
      return <ConfirmedScreen onDone={showMain} />;
    case "account":
      return (
        <CardScreen title="My Account" onBack={showMain}>
          <HomeScreen
            onShowMyQrCode={() => setCurrentPage({ name: "myQrCode" })}
            onFindProfile={(username) => setCurrentPage({ name: "profile", username })}
          />
        </CardScreen>
      );
    case "myQrCode":
      return (
        <CardScreen title="My QR Code">
          <MyQrCodeScreen onBack={() => setCurrentPage({ name: "account" })} />
        </CardScreen>
      );
    case "profile":
      return (
        <CardScreen title="Profile">
          <ProfileScreen username={currentPage.username} onBack={showMain} />
        </CardScreen>
      );
    default:
      return (
        <MainScreen
          friends={friendList.friends}
          selectedFriend={friendList.selectedFriend}
          errorMessage={friendList.errorMessage}
          onSelectFriend={friendList.selectFriend}
          onAddFriend={friendList.addFriend}
          onSettleUp={friendList.settleUp}
          onScan={startScan}
          onManual={startManualEntry}
          onShowAccount={() => setCurrentPage({ name: "account" })}
          onLogout={logOut}
        />
      );
  }
}

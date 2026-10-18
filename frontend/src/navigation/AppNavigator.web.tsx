import { useState } from "react";

import { SettingsSection } from "../components/settings/settingsSections";
import { useAuth } from "../hooks/useAuth";
import { useFriends } from "../hooks/useFriends";
import { useGroceryRun } from "../hooks/useGroceryRun";
import { useReceiptScanner } from "../hooks/useReceiptScanner";
import { clearSharedUsername, readSharedUsername } from "../linking/sharedProfile";
import ConfirmedScreen from "../screens/ConfirmedScreen";
import FriendProfileScreen from "../screens/FriendProfileScreen";
import MainScreen from "../screens/MainScreen";
import ManageItemsScreen from "../screens/ManageItemsScreen";
import ScanReceiptScreen from "../screens/ScanReceiptScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SplitHistoryScreen from "../screens/SplitHistoryScreen";
import { convertUserToFriend } from "../services/friends";

type AppPage =
  | { name: "main" }
  | { name: "scan" }
  | { name: "manage" }
  | { name: "confirmed" }
  | { name: "history" }
  | { name: "settings"; section: SettingsSection }
  | { name: "profile"; username: string; returnPage: "main" | "settings" };

function getInitialPage(): AppPage {
  const sharedUsername = readSharedUsername();
  return sharedUsername ? { name: "profile", username: sharedUsername, returnPage: "main" } : { name: "main" };
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

  function showSettings(section: SettingsSection) {
    friendList.refreshFriends();
    setCurrentPage({ name: "settings", section });
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
    case "history":
      return <SplitHistoryScreen people={assignableFriends} onBack={showMain} />;
    case "confirmed":
      return <ConfirmedScreen onDone={showMain} />;
    case "settings":
      return (
        <SettingsScreen
          activeSection={currentPage.section}
          onSelectSection={(section) => setCurrentPage({ name: "settings", section })}
          friends={friendList.friends}
          onAddFriend={friendList.addFriend}
          onRemoveFriend={friendList.removeFriend}
          onViewProfile={(username) => setCurrentPage({ name: "profile", username, returnPage: "settings" })}
          onBack={showMain}
        />
      );
    case "profile":
      return (
        <FriendProfileScreen
          username={currentPage.username}
          onBack={currentPage.returnPage === "settings" ? () => showSettings("friends") : showMain}
        />
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
          onShowSettings={() => showSettings("profile")}
          onShowHistory={() => setCurrentPage({ name: "history" })}
          onLogout={logOut}
        />
      );
  }
}

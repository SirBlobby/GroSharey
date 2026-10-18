import { useState } from "react";

import { SettingsSection } from "../components/settings/settingsSections";
import VoiceAssistantPanel from "../components/assistant/VoiceAssistantPanel";
import NotificationToasts from "../components/notifications/NotificationToasts";
import { useAuth } from "../hooks/useAuth";
import { useFriends } from "../hooks/useFriends";
import { useGroceryRun } from "../hooks/useGroceryRun";
import { useGroups } from "../hooks/useGroups";
import { useNotifications } from "../hooks/useNotifications";
import { usePendingPayments } from "../hooks/usePendingPayments";
import { useReceiptScanner } from "../hooks/useReceiptScanner";
import { clearSharedUsername, readSharedUsername } from "../linking/sharedProfile";
import ConfirmedScreen from "../screens/ConfirmedScreen";
import FriendProfileScreen from "../screens/FriendProfileScreen";
import MainScreen from "../screens/MainScreen";
import ManageItemsScreen from "../screens/ManageItemsScreen";
import ScanReceiptScreen from "../screens/ScanReceiptScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ShoppingListsScreen from "../screens/ShoppingListsScreen";
import { convertProfileToFriend, convertUserToFriend } from "../services/friends";
import type { Friend } from "../types";
import { AppNotification } from "../types/notification";

type AppPage =
  | { name: "main" }
  | { name: "scan" }
  | { name: "manage" }
  | { name: "confirmed"; crossedOffItems: string[] }
  | { name: "lists"; listId: string | null }
  | { name: "settings"; section: SettingsSection }
  | { name: "profile"; username: string; returnPage: "main" | "settings" };

function getInitialPage(): AppPage {
  const sharedUsername = readSharedUsername();
  return sharedUsername ? { name: "profile", username: sharedUsername, returnPage: "main" } : { name: "main" };
}

export default function AppNavigator() {
  const { currentUser } = useAuth();
  const friendList = useFriends();
  const groceryRun = useGroceryRun();
  const receiptScanner = useReceiptScanner();
  const notificationCenter = useNotifications();
  const groupList = useGroups();
  const pendingPayments = usePendingPayments(currentUser?.username ?? "");
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const assignableFriends = currentUser
    ? [convertUserToFriend(currentUser), ...friendList.friends]
    : friendList.friends;

  function listSplitPeople(): Friend[] {
    const splitGroupId = groceryRun.splitGroup?.groupId;
    const splitGroup = groupList.groups.find((group) => group.id === splitGroupId);
    const knownUsernames = new Set(assignableFriends.map((person) => person.username));
    const otherMembers = (splitGroup?.members ?? [])
      .filter((member) => !knownUsernames.has(member.username))
      .map(convertProfileToFriend);
    return [...assignableFriends, ...otherMembers];
  }

  function showMain() {
    clearSharedUsername();
    friendList.refreshFriends();
    pendingPayments.refreshPendingPayments();
    groupList.refreshGroups();
    setCurrentPage({ name: "main" });
  }

  function showSettings(section: SettingsSection) {
    friendList.refreshFriends();
    groupList.refreshGroups();
    setCurrentPage({ name: "settings", section });
  }

  function openNotification(notification: AppNotification) {
    notificationCenter.markRead(notification.id);
    if (notification.category === "splits") {
      showSettings("history");
    } else if (notification.category === "account") {
      showSettings("auditLog");
    } else if (notification.category === "payments" && notification.actor_username) {
      friendList.selectFriend(notification.actor_username);
      showMain();
    } else if (notification.category === "groups") {
      showSettings("groups");
    } else if (notification.category === "lists") {
      showShoppingLists(null);
    } else if (notification.actor_username) {
      setCurrentPage({ name: "profile", username: notification.actor_username, returnPage: "main" });
    }
  }

  async function settleUp(friend: Friend, amount: number) {
    await friendList.settleUp(friend, amount);
    await pendingPayments.refreshPendingPayments();
  }

  async function confirmPayment(paymentId: string) {
    await pendingPayments.confirmPayment(paymentId);
    await friendList.refreshFriends();
  }

  function refreshAfterAssistant() {
    groupList.refreshGroups();
    friendList.refreshFriends();
    pendingPayments.refreshPendingPayments();
  }

  function showShoppingLists(listId: string | null) {
    groupList.refreshGroups();
    setCurrentPage({ name: "lists", listId });
  }

  function startScan() {
    receiptScanner.reset();
    setCurrentPage({ name: "scan" });
  }

  function startManualEntry() {
    groupList.refreshGroups();
    groceryRun.startManualEntry();
    setCurrentPage({ name: "manage" });
  }


  async function confirmGroceryRun() {
    const savedSplit = await groceryRun.saveGroceryRun();
    if (savedSplit) {
      setCurrentPage({ name: "confirmed", crossedOffItems: savedSplit.crossed_off_items });
    }
  }

  function renderCurrentPage() {
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
            onReceiptDetailsChange={groceryRun.updateReceiptDetails}
            currentUsername={currentUser?.username ?? ""}
            splitPayment={groceryRun.splitPayment}
            onPayerChange={groceryRun.setPayer}
            onUpfrontPaymentChange={groceryRun.setUpfrontPayment}
            friends={listSplitPeople()}
            onAddFriend={friendList.addFriend}
            groups={groupList.groups}
            splitGroup={groceryRun.splitGroup}
            isMatchingGroup={groceryRun.isMatchingGroup}
            groupErrorMessage={groceryRun.groupErrorMessage}
            onChooseGroup={groceryRun.chooseGroup}
            onClearGroup={groceryRun.clearGroup}
            errorMessage={groceryRun.errorMessage}
            isSaving={groceryRun.isSaving}
            onBack={showMain}
            onConfirm={confirmGroceryRun}
          />
        );
      case "confirmed":
        return <ConfirmedScreen crossedOffItems={currentPage.crossedOffItems} onDone={showMain} />;
      case "lists":
        return (
          <ShoppingListsScreen
            groupList={groupList}
            currentUsername={currentUser?.username ?? ""}
            initialListId={currentPage.listId}
            onBack={showMain}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            activeSection={currentPage.section}
            onSelectSection={(section) => setCurrentPage({ name: "settings", section })}
            friends={friendList.friends}
            people={assignableFriends}
            onAddFriend={friendList.addFriend}
            onRemoveFriend={friendList.removeFriend}
            groupList={groupList}
            currentUsername={currentUser?.username ?? ""}
            onOpenShoppingList={showShoppingLists}
            onViewProfile={(username) => setCurrentPage({ name: "profile", username, returnPage: "settings" })}
            onBack={showMain}
          />
        );
      case "profile":
        return (
          <FriendProfileScreen
            username={currentPage.username}
            friends={friendList.friends}
            people={assignableFriends}
            onAddFriend={friendList.addFriend}
            onRemoveFriend={friendList.removeFriend}
            onSettleUp={settleUp}
            onBack={currentPage.returnPage === "settings" ? () => showSettings("friends") : showMain}
          />
        );
      default:
        return (
          <MainScreen
            currentUsername={currentUser?.username ?? ""}
            friends={friendList.friends}
            people={assignableFriends}
            selectedFriend={friendList.selectedFriend}
            errorMessage={friendList.errorMessage}
            onSelectFriend={friendList.selectFriend}
            onAddFriend={friendList.addFriend}
            onSettleUp={settleUp}
            paymentsToConfirm={pendingPayments.paymentsToConfirm}
            paymentsAwaitingFriends={pendingPayments.paymentsAwaitingFriends}
            onConfirmPayment={confirmPayment}
            onScan={startScan}
            onManual={startManualEntry}
            onShowSettings={() => showSettings("profile")}
            onShowShoppingLists={() => showShoppingLists(null)}
            onShowAssistant={() => setIsAssistantOpen(true)}
            groups={groupList.groups}
            onOpenShoppingList={showShoppingLists}
            onManageGroups={() => showSettings("groups")}
            onStartTrip={groupList.startTrip}
            onEndTrip={groupList.endTrip}
            onViewProfile={(username) => setCurrentPage({ name: "profile", username, returnPage: "main" })}
            notificationCenter={notificationCenter}
            onOpenNotification={openNotification}
          />
        );
    }
  }

  return (
    <>
      {renderCurrentPage()}
      {isAssistantOpen && (
        <VoiceAssistantPanel onDataChanged={refreshAfterAssistant} onClose={() => setIsAssistantOpen(false)} />
      )}
      <NotificationToasts
        toasts={notificationCenter.toasts}
        onOpenNotification={openNotification}
        onDismiss={notificationCenter.dismissToast}
      />
    </>
  );
}

type WindowWithDomHost = Window & {
  $$EXPO_DOM_HOST_OS?: string;
};

export function isRunningInMobileApp(): boolean {
  return typeof window !== "undefined" && Boolean((window as WindowWithDomHost).$$EXPO_DOM_HOST_OS);
}

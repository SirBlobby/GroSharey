import { useEffect, useState } from "react";

import { profilesApi } from "../api/profilesApi";
import { PublicProfile } from "../types/profile";

export function useProfile(username: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setErrorMessage(null);
    setProfile(null);

    profilesApi
      .getProfile(username)
      .then((fetchedProfile) => {
        if (isCurrentRequest) setProfile(fetchedProfile);
      })
      .catch((error: Error) => {
        if (isCurrentRequest) setErrorMessage(error.message);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [username]);

  return { profile, isLoading, errorMessage };
}

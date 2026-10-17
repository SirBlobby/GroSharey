from server.models.user_models import PublicProfile, StoredUser, User


def build_profile_picture_url(stored_user: StoredUser) -> str | None:
    if stored_user.profile_picture_version is None:
        return None
    return f"/api/profiles/{stored_user.username}/picture?version={stored_user.profile_picture_version}"


def convert_to_public_profile(stored_user: StoredUser) -> PublicProfile:
    return PublicProfile(
        id=stored_user.id,
        username=stored_user.username,
        display_name=stored_user.display_name,
        profile_picture_url=build_profile_picture_url(stored_user),
    )


def convert_to_user(stored_user: StoredUser) -> User:
    return User(
        **convert_to_public_profile(stored_user).model_dump(),
        email=stored_user.email,
        created_at=stored_user.created_at,
    )

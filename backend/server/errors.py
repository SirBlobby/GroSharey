class NotFoundError(Exception):
    def __init__(self, resource_name: str, resource_id: str):
        self.resource_name = resource_name
        self.resource_id = resource_id
        super().__init__(f"{resource_name} {resource_id} not found")


class UnauthorizedError(Exception):
    pass


class ConflictError(Exception):
    pass

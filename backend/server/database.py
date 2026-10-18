from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from server.config import settings


@lru_cache
def get_database() -> Database:
    mongo_client = MongoClient(settings.mongodb_uri, tz_aware=True)
    return mongo_client[settings.mongodb_database_name]

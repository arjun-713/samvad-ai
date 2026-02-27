import os
from dotenv import load_dotenv

load_dotenv()

def get_environment() -> str:
    return os.getenv("ENVIRONMENT", "local")

def use_aws() -> bool:
    return get_environment() in ("demo", "aws")

def use_local() -> bool:
    return get_environment() == "local"

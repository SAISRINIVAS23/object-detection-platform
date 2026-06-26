import os

SECRET_KEY = "change_this_to_long_random_secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://olegolorszuwfesyyfef.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_BP7_7ICqa2D52f20z8py0Q_wOR8Q51w")
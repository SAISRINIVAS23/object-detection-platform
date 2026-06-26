from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SECRET_KEY, ALGORITHM

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Query user via Supabase
    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        users = response.data
        if not users:
            raise credentials_exception
        return users[0]
    except Exception as e:
        print("Supabase auth query error:", str(e))
        raise credentials_exception
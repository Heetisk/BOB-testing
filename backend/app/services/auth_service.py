"""
Authentication service.

Handles user login, token creation, and user lookup.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Find a user by email address."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Find a user by ID."""
        result = await self.db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password.

        Returns:
            User object if authentication succeeds, None otherwise
        """
        user = await self.get_user_by_email(email)
        if user is None:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def create_token(self, user: User) -> str:
        """Create JWT access token for a user."""
        token_data = {"sub": str(user.user_id), "email": user.email, "role": user.role}
        return create_access_token(token_data)

    async def create_user(
        self,
        email: str,
        password: str,
        name: str,
        role: str = "customer",
        phone: Optional[str] = None,
        usual_city: Optional[str] = None,
        usual_device: Optional[str] = None,
    ) -> User:
        """Create a new user."""
        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            role=role,
            phone=phone,
            usual_city=usual_city,
            usual_device=usual_device,
        )
        self.db.add(user)
        await self.db.flush()
        return user

"""
Authentication and security abstraction for SpillTrace AI.
Provides the default authenticated operator context and future JWT/OAuth2 integration hooks.
"""
from typing import Optional
from pydantic import BaseModel

class User(BaseModel):
    id: str = "usr-forensic-01"
    email: str = "analyst@spilltrace.marine.gov"
    full_name: str = "Cmdr. Elena Rostova"
    role: str = "Senior Forensic Analyst"
    organization: str = "Maritime Environmental Protection Agency"
    is_active: bool = True

def get_current_user() -> User:
    """Returns the authenticated user or default forensic operator context."""
    return User()

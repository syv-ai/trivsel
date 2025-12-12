from fastapi import APIRouter

from app.api.routes import (
    analytics,
    assignments,
    consent,
    dashboard,
    groups,
    login,
    private,
    questions,
    students,
    survey,
    system,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()

# Authentication
api_router.include_router(login.router)
api_router.include_router(users.router)

# TrivselsTracker routes
api_router.include_router(survey.router)  # Public survey routes (token-based)
api_router.include_router(consent.router)  # Public consent routes (token-based)
api_router.include_router(students.router)
api_router.include_router(dashboard.router)
api_router.include_router(questions.router)
api_router.include_router(groups.router)
api_router.include_router(assignments.router)
api_router.include_router(analytics.router)
api_router.include_router(system.router)

# Utilities
api_router.include_router(utils.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)

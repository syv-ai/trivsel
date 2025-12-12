from sqlmodel import Session, create_engine, select, SQLModel

from app import crud
from app.core.config import settings
from app.models import (
    User,
    UserCreate,
    SurveyQuestion,
    SurveyQuestionCreate,
    SurveyCategory,
    QuestionPhase,
)

engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=300,    # Recycle connections after 5 minutes
)


def reset_db() -> None:
    """Drop all tables and recreate them."""
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    # Seed survey questions if none exist
    existing_questions = session.exec(select(SurveyQuestion)).first()
    if not existing_questions:
        seed_questions = [
            # Trivsel (Wellbeing) - 3 questions
            SurveyQuestionCreate(
                category=SurveyCategory.TRIVSEL,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg føler mig generelt godt tilpas i mit daglige liv",
                order=0,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.TRIVSEL,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg har overskud til at klare mine daglige opgaver",
                order=1,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.TRIVSEL,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg sover godt og føler mig udhvilet",
                order=2,
            ),
            # Motivation - 3 questions
            SurveyQuestionCreate(
                category=SurveyCategory.MOTIVATION,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg er motiveret for at arbejde mod mine mål",
                order=0,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.MOTIVATION,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg føler, at det jeg laver giver mening",
                order=1,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.MOTIVATION,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg har lyst til at lære nye ting",
                order=2,
            ),
            # Fællesskab (Community) - 3 questions
            SurveyQuestionCreate(
                category=SurveyCategory.FAELLESSKAB,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg føler mig som en del af et fællesskab",
                order=0,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.FAELLESSKAB,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg har nogen, jeg kan tale med, hvis jeg har brug for det",
                order=1,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.FAELLESSKAB,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg føler mig accepteret af de mennesker omkring mig",
                order=2,
            ),
            # Selvindsigt (Self-insight) - 3 questions
            SurveyQuestionCreate(
                category=SurveyCategory.SELVINDSIGT,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg er bevidst om mine styrker og svagheder",
                order=0,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.SELVINDSIGT,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg kan mærke, når jeg har brug for en pause",
                order=1,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.SELVINDSIGT,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg forstår, hvad der påvirker mit humør",
                order=2,
            ),
            # Arbejdsparathed (Work readiness) - 3 questions
            SurveyQuestionCreate(
                category=SurveyCategory.ARBEJDSPARATHED,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg føler mig klar til at møde op og deltage aktivt",
                order=0,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.ARBEJDSPARATHED,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg kan koncentrere mig om mine opgaver",
                order=1,
            ),
            SurveyQuestionCreate(
                category=SurveyCategory.ARBEJDSPARATHED,
                phase=QuestionPhase.ALL,
                question_text_da="Jeg kan samarbejde godt med andre",
                order=2,
            ),
        ]

        for question_in in seed_questions:
            crud.create_question(session=session, question_in=question_in)

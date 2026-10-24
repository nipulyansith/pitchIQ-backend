"""Business logic for coach-managed athletes."""

from backend.database import (
    create_athlete,
    delete_athlete,
    get_athlete,
    get_athletes,
    update_athlete,
)


def create_athlete_for_coach(*, coach_id, name, playing_level=None):
    athlete_id = create_athlete(coach_id, name, playing_level)
    return get_athlete(athlete_id, coach_id)


def list_coach_athletes(*, coach_id):
    return get_athletes(coach_id)


def get_coach_athlete(*, athlete_id, coach_id):
    return get_athlete(athlete_id, coach_id)


def remove_coach_athlete(*, athlete_id, coach_id):
    return delete_athlete(athlete_id, coach_id)


def update_coach_athlete(*, athlete_id, coach_id, name, playing_level=None):
    return update_athlete(athlete_id, coach_id, name, playing_level)

from copy import deepcopy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


INITIAL_ACTIVITIES = deepcopy(app_module.activities)
client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    app_module.activities = deepcopy(INITIAL_ACTIVITIES)


def activity_url(activity_name):
    return f"/activities/{quote(activity_name, safe='')}/signup"


def test_root_redirects_to_frontend():
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_activity_data():
    response = client.get("/activities")

    assert response.status_code == 200
    assert "Chess Club" in response.json()
    assert response.json()["Chess Club"]["participants"] == [
        {"participantName": "Michael", "email": "michael@mergington.edu"},
        {"participantName": "Daniel", "email": "daniel@mergington.edu"},
    ]


def test_signup_adds_participant_to_activity():
    activity_name = "Art Club"
    email = "new.student@example.com"
    participant_name = "New Student"

    response = client.post(
        activity_url(activity_name),
        params={"email": email, "participantName": participant_name},
    )

    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert {
        "participantName": participant_name,
        "email": email,
    } in client.get("/activities").json()[activity_name]["participants"]


def test_signup_returns_404_for_unknown_activity():
    response = client.post(
        activity_url("Unknown Club"),
        params={"email": "student@example.com", "participantName": "Student"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_returns_400_for_invalid_email():
    response = client.post(
        activity_url("Art Club"),
        params={"email": "not-an-email", "participantName": "Student"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid email address"


def test_signup_returns_400_when_activity_is_full():
    activity = app_module.activities["Art Club"]
    activity["participants"] = [
        app_module.Participant(
            participantName=f"Student {index}",
            email=f"student{index}@example.com",
        )
        for index in range(activity["max_participants"])
    ]

    response = client.post(
        activity_url("Art Club"),
        params={"email": "new.student@example.com", "participantName": "New Student"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"


def test_signup_returns_400_for_duplicate_participant():
    email = "michael@mergington.edu"

    response = client.post(
        activity_url("Chess Club"),
        params={"email": email, "participantName": "Michael"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_remove_signup_removes_participant_from_activity():
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    response = client.delete(activity_url(activity_name), params={"email": email})

    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from {activity_name}"}
    assert all(
        participant["email"] != email
        for participant in client.get("/activities").json()[activity_name]["participants"]
    )


def test_remove_signup_returns_404_for_unknown_activity():
    response = client.delete(activity_url("Unknown Club"), params={"email": "student@example.com"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_signup_returns_404_for_unregistered_participant():
    response = client.delete(
        activity_url("Art Club"),
        params={"email": "student@example.com"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_signup_requires_participant_name():
    response = client.post(activity_url("Art Club"), params={"email": "student@example.com"})

    assert response.status_code == 422


@pytest.mark.parametrize("participant_name", ["", "x" * 51])
def test_signup_rejects_participant_name_outside_allowed_length(participant_name):
    response = client.post(
        activity_url("Art Club"),
        params={"email": "student@example.com", "participantName": participant_name},
    )

    assert response.status_code == 422


def test_signup_accepts_participant_name_at_maximum_length():
    participant_name = "x" * 50
    email = "student@example.com"

    response = client.post(
        activity_url("Art Club"),
        params={"email": email, "participantName": participant_name},
    )

    assert response.status_code == 200
    assert {
        "participantName": participant_name,
        "email": email,
    } in client.get("/activities").json()["Art Club"]["participants"]
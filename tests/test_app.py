from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_root_redirects_to_index():
    response = client.get("/", follow_redirects=False)
    assert response.status_code in (301, 302, 307, 308)
    assert response.headers.get("location") == "/static/index.html"


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Basketball Team" in data
    assert isinstance(data["Basketball Team"]["participants"], list)


def test_signup_and_unregister_flow():
    activity = "Debate Team"
    email = "teststudent@example.com"

    # Ensure clean state: remove if present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    r2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r2.status_code == 400

    # Unregister
    r3 = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert r3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should return 404
    r4 = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert r4.status_code == 404


def test_signup_nonexistent_activity():
    r = client.post("/activities/NoSuchActivity/signup", params={"email": "a@b.c"})
    assert r.status_code == 404

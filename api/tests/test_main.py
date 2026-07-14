import pytest
from fastapi.testclient import TestClient
from pyqubo import Array

import main
from main import (
    ClassInput,
    DUMMY_PENALTY,
    InstructorInput,
    _time_in_window,
    app,
    build_hamiltonian,
    decode_schedule,
    group_classes_by_timeslot,
)

DUMMY = "ダミー講師"

client = TestClient(app)


# ---------------------------------------------------------------------------
# _time_in_window
# ---------------------------------------------------------------------------


class TestTimeInWindow:
    def test_inside_window(self):
        assert _time_in_window("10:00", "09:00", "12:00") is True

    def test_start_boundary_is_inclusive(self):
        assert _time_in_window("09:00", "09:00", "12:00") is True

    def test_end_boundary_is_exclusive(self):
        assert _time_in_window("12:00", "09:00", "12:00") is False

    def test_before_window(self):
        assert _time_in_window("08:59", "09:00", "12:00") is False

    def test_after_window(self):
        assert _time_in_window("13:00", "09:00", "12:00") is False


# ---------------------------------------------------------------------------
# group_classes_by_timeslot
# ---------------------------------------------------------------------------


class TestGroupClassesByTimeslot:
    def test_groups_by_period(self):
        classes = [
            ClassInput(id="a", period=1, subject="数学"),
            ClassInput(id="b", period=1, subject="英語"),
            ClassInput(id="c", period=2, subject="数学"),
        ]
        assert group_classes_by_timeslot(classes) == {1: [0, 1], 2: [2]}

    def test_empty(self):
        assert group_classes_by_timeslot([]) == {}


# ---------------------------------------------------------------------------
# build_hamiltonian
# ---------------------------------------------------------------------------


def compile_model(instructors, classes, dummy=DUMMY):
    q = Array.create("q", shape=(len(instructors), len(classes)), vartype="BINARY")
    H = build_hamiltonian(q, instructors, classes, dummy)
    return H.compile()


def evaluate(model, assignment, num_instructors, num_classes):
    """assignment: {(i, j): 0/1} を pyqubo のサンプル形式にして評価する"""
    sample = {
        f"q[{i}][{j}]": assignment.get((i, j), 0)
        for i in range(num_instructors)
        for j in range(num_classes)
    }
    decoded = model.decode_sample(sample, vartype="BINARY")
    return decoded, decoded.constraints(only_broken=True)


class TestBuildHamiltonian:
    def test_valid_assignment_breaks_nothing(self):
        instructors = [
            InstructorInput(id="t1", subject="数学"),
            InstructorInput(id=DUMMY),
        ]
        classes = [ClassInput(id="c1", period=1, subject="数学")]
        model = compile_model(instructors, classes)

        decoded, broken = evaluate(model, {(0, 0): 1}, 2, 1)
        assert broken == {}
        assert decoded.energy == 0.0

    def test_unassigned_class_breaks_constraint(self):
        instructors = [InstructorInput(id="t1"), InstructorInput(id=DUMMY)]
        classes = [ClassInput(id="c1", period=1, subject="数学")]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {}, 2, 1)
        assert "class_0_assigned" in broken

    def test_same_period_double_booking_is_forbidden(self):
        instructors = [InstructorInput(id="t1"), InstructorInput(id=DUMMY)]
        classes = [
            ClassInput(id="c1", period=1, subject="数学"),
            ClassInput(id="c2", period=1, subject="数学"),
        ]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1, (0, 1): 1}, 2, 2)
        assert "no_overlap_0_0_1" in broken

    def test_different_period_double_booking_is_allowed(self):
        instructors = [InstructorInput(id="t1"), InstructorInput(id=DUMMY)]
        classes = [
            ClassInput(id="c1", period=1, subject="数学"),
            ClassInput(id="c2", period=2, subject="数学"),
        ]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1, (0, 1): 1}, 2, 2)
        assert broken == {}

    def test_dummy_can_absorb_same_period_classes(self):
        instructors = [InstructorInput(id="t1"), InstructorInput(id=DUMMY)]
        classes = [
            ClassInput(id="c1", period=1, subject="数学"),
            ClassInput(id="c2", period=1, subject="数学"),
        ]
        model = compile_model(instructors, classes)

        decoded, broken = evaluate(model, {(1, 0): 1, (1, 1): 1}, 2, 2)
        assert broken == {}
        # ダミー割り当てはハード制約違反ではないがペナルティが乗る
        assert decoded.energy == pytest.approx(DUMMY_PENALTY * 2)

    def test_subject_mismatch_is_forbidden(self):
        instructors = [
            InstructorInput(id="t1", subject="数学"),
            InstructorInput(id=DUMMY),
        ]
        classes = [ClassInput(id="c1", period=1, subject="英語")]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1}, 2, 1)
        assert "subject_mismatch_0_0" in broken

    def test_no_subject_means_any_subject(self):
        instructors = [InstructorInput(id="t1"), InstructorInput(id=DUMMY)]
        classes = [ClassInput(id="c1", period=1, subject="英語")]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1}, 2, 1)
        assert broken == {}

    def test_outside_time_window_is_forbidden(self):
        instructors = [
            InstructorInput(id="t1", available_start="09:00", available_end="12:00"),
            InstructorInput(id=DUMMY),
        ]
        classes = [
            ClassInput(id="c1", period=1, subject="数学", start_time="13:00")
        ]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1}, 2, 1)
        assert "time_window_0_0" in broken

    def test_inside_time_window_is_allowed(self):
        instructors = [
            InstructorInput(id="t1", available_start="09:00", available_end="12:00"),
            InstructorInput(id=DUMMY),
        ]
        classes = [
            ClassInput(id="c1", period=1, subject="数学", start_time="10:00")
        ]
        model = compile_model(instructors, classes)

        _, broken = evaluate(model, {(0, 0): 1}, 2, 1)
        assert broken == {}


# ---------------------------------------------------------------------------
# decode_schedule
# ---------------------------------------------------------------------------


class TestDecodeSchedule:
    instructors = [
        InstructorInput(id="t1", subject="数学"),
        InstructorInput(id=DUMMY),
    ]
    classes = [
        ClassInput(id="c1", period=1, subject="数学"),
        ClassInput(id="c2", period=2, subject="英語"),
    ]

    def test_assigned_to_instructor(self):
        sample = {"q[0][0]": 1, "q[1][1]": 1}
        result = decode_schedule(sample, self.instructors, self.classes, DUMMY)
        assert result[0] == {
            "class_id": "c1",
            "assigned_instructor": "t1",
            "is_unassigned": False,
        }

    def test_assigned_to_dummy_is_unassigned(self):
        sample = {"q[0][0]": 1, "q[1][1]": 1}
        result = decode_schedule(sample, self.instructors, self.classes, DUMMY)
        assert result[1] == {
            "class_id": "c2",
            "assigned_instructor": DUMMY,
            "is_unassigned": True,
        }

    def test_no_assignment_at_all(self):
        result = decode_schedule({}, self.instructors, self.classes, DUMMY)
        assert all(r["assigned_instructor"] == "未配置" for r in result)
        assert all(r["is_unassigned"] for r in result)


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------


def optimize_payload():
    return {
        "instructors": [
            {"id": "t1", "subject": "数学", "available_start": "09:00", "available_end": "18:00"},
            {"id": DUMMY},
        ],
        "classes": [
            {"id": "c1", "period": 1, "subject": "数学", "start_time": "10:00"},
        ],
        "dummy_instructor": DUMMY,
    }


class TestHealthEndpoint:
    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


class TestOptimizeAuth:
    def test_missing_api_key_is_401(self, monkeypatch):
        monkeypatch.setattr(main, "OPTIMIZE_API_KEY", "secret")
        res = client.post("/api/optimize", json=optimize_payload())
        assert res.status_code == 401

    def test_wrong_api_key_is_401(self, monkeypatch):
        monkeypatch.setattr(main, "OPTIMIZE_API_KEY", "secret")
        res = client.post(
            "/api/optimize",
            json=optimize_payload(),
            headers={"X-Api-Key": "wrong"},
        )
        assert res.status_code == 401

    def test_server_without_key_configured_is_500(self, monkeypatch):
        monkeypatch.setattr(main, "OPTIMIZE_API_KEY", None)
        res = client.post(
            "/api/optimize",
            json=optimize_payload(),
            headers={"X-Api-Key": "anything"},
        )
        assert res.status_code == 500


class TestOptimizeEndpoint:
    @pytest.fixture(autouse=True)
    def _api_key(self, monkeypatch):
        monkeypatch.setattr(main, "OPTIMIZE_API_KEY", "secret")

    def post(self, payload):
        return client.post(
            "/api/optimize", json=payload, headers={"X-Api-Key": "secret"}
        )

    def test_simple_assignment(self):
        res = self.post(optimize_payload())
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "success"
        assert body["schedule"] == [
            {"class_id": "c1", "assigned_instructor": "t1", "is_unassigned": False}
        ]

    def test_subject_mismatch_falls_back_to_dummy(self):
        payload = optimize_payload()
        payload["classes"][0]["subject"] = "英語"
        res = self.post(payload)
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "success"
        assert body["schedule"][0]["assigned_instructor"] == DUMMY
        assert body["schedule"][0]["is_unassigned"] is True

    def test_same_period_classes_split_between_instructor_and_dummy(self):
        payload = optimize_payload()
        payload["classes"] = [
            {"id": "c1", "period": 1, "subject": "数学", "start_time": "10:00"},
            {"id": "c2", "period": 1, "subject": "数学", "start_time": "10:00"},
        ]
        res = self.post(payload)
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "success"
        assigned = {s["assigned_instructor"] for s in body["schedule"]}
        # 講師は1人なので、片方は必ずダミーに落ちる
        assert assigned == {"t1", DUMMY}

    def test_duplicate_instructor_ids_are_rejected(self):
        payload = optimize_payload()
        payload["instructors"] = [{"id": "t1"}, {"id": "t1"}]
        res = self.post(payload)
        assert res.status_code == 422

    def test_period_out_of_range_is_rejected(self):
        payload = optimize_payload()
        payload["classes"][0]["period"] = 9
        res = self.post(payload)
        assert res.status_code == 422

    def test_empty_classes_are_rejected(self):
        payload = optimize_payload()
        payload["classes"] = []
        res = self.post(payload)
        assert res.status_code == 422

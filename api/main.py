import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from pyqubo import Array, Constraint
import neal

app = FastAPI()

# デプロイ先のフロントURLは ALLOWED_ORIGINS 環境変数（カンマ区切り）で指定する
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

W_HARD = 1000.0
DUMMY_PENALTY = 50.0
SA_NUM_READS = 100

OPTIMIZE_API_KEY = os.environ.get("OPTIMIZE_API_KEY")


def verify_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if not OPTIMIZE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPTIMIZE_API_KEY が設定されていません。環境変数を設定してAPIを再起動してください。",
        )
    if x_api_key != OPTIMIZE_API_KEY:
        raise HTTPException(status_code=401, detail="認証に失敗しました。")


class InstructorInput(BaseModel):
    id: str = Field(..., description="講師のプロフィールID（ダミー講師はdummy_instructorと同じ値）")
    subject: str | None = Field(default=None, description="担当科目。未設定は全科目対応とみなす")
    available_start: str | None = Field(default=None, description="出勤開始時刻 HH:MM")
    available_end: str | None = Field(default=None, description="出勤終了時刻 HH:MM")


class ClassInput(BaseModel):
    id: str = Field(..., description="授業(lessons)のID")
    period: int = Field(..., ge=1, le=8, description="時限")
    subject: str = Field(..., description="科目")
    start_time: str | None = Field(default=None, description="開始時刻 HH:MM")


class ShiftData(BaseModel):
    instructors: list[InstructorInput] = Field(..., min_length=1, description="講師のリスト")
    classes: list[ClassInput] = Field(..., min_length=1, description="授業のリスト")
    dummy_instructor: str = Field(default="ダミー講師", description="未配置枠を吸収する仮想講師のID")

    @field_validator("instructors")
    @classmethod
    def validate_unique_instructors(
        cls, v: list[InstructorInput]
    ) -> list[InstructorInput]:
        ids = [instructor.id for instructor in v]
        if len(ids) != len(set(ids)):
            raise ValueError("講師IDは重複できません")
        return v


def _time_in_window(point: str, start: str, end: str) -> bool:
    return start <= point < end


def group_classes_by_timeslot(classes: list[ClassInput]) -> dict[int, list[int]]:
    timeslots: dict[int, list[int]] = {}
    for j, class_item in enumerate(classes):
        timeslots.setdefault(class_item.period, []).append(j)
    return timeslots


def build_hamiltonian(
    q,
    instructors: list[InstructorInput],
    classes: list[ClassInput],
    dummy_instructor: str,
):
    num_instructors = len(instructors)
    num_classes = len(classes)
    H = 0.0

    # 各授業は必ずちょうど1人に割り当てる
    for j in range(num_classes):
        H += W_HARD * Constraint(
            (sum(q[i, j] for i in range(num_instructors)) - 1) ** 2,
            label=f"class_{j}_assigned",
        )

    # 同じ講師が同一時限の複数授業を掛け持ちできない（ダミーは除外）
    timeslots = group_classes_by_timeslot(classes)
    for i, instructor in enumerate(instructors):
        if instructor.id == dummy_instructor:
            continue
        for class_indices in timeslots.values():
            if len(class_indices) < 2:
                continue
            for idx1 in range(len(class_indices)):
                for idx2 in range(idx1 + 1, len(class_indices)):
                    j1, j2 = class_indices[idx1], class_indices[idx2]
                    H += W_HARD * Constraint(
                        q[i, j1] * q[i, j2],
                        label=f"no_overlap_{i}_{j1}_{j2}",
                    )

    # 科目不一致・勤務時間帯外の割り当てを禁止する（ダミーは対象外）
    for i, instructor in enumerate(instructors):
        if instructor.id == dummy_instructor:
            continue

        for j, class_item in enumerate(classes):
            if instructor.subject and instructor.subject != class_item.subject:
                H += W_HARD * Constraint(
                    q[i, j],
                    label=f"subject_mismatch_{i}_{j}",
                )
                continue

            if (
                instructor.available_start
                and instructor.available_end
                and class_item.start_time
                and not _time_in_window(
                    class_item.start_time,
                    instructor.available_start,
                    instructor.available_end,
                )
            ):
                H += W_HARD * Constraint(
                    q[i, j],
                    label=f"time_window_{i}_{j}",
                )

    dummy_index = next(
        (i for i, instructor in enumerate(instructors) if instructor.id == dummy_instructor),
        None,
    )
    if dummy_index is not None:
        for j in range(num_classes):
            H += DUMMY_PENALTY * q[dummy_index, j]

    return H


def decode_schedule(
    sample: dict,
    instructors: list[InstructorInput],
    classes: list[ClassInput],
    dummy_instructor: str,
) -> list[dict]:
    result = []
    for j, class_item in enumerate(classes):
        assigned_instructor = "未配置"
        is_unassigned = True

        for i, instructor in enumerate(instructors):
            if sample.get(f"q[{i}][{j}]", 0) == 1:
                assigned_instructor = instructor.id
                is_unassigned = instructor.id == dummy_instructor
                break

        result.append(
            {
                "class_id": class_item.id,
                "assigned_instructor": assigned_instructor,
                "is_unassigned": is_unassigned,
            }
        )
    return result


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/optimize", dependencies=[Depends(verify_api_key)])
def optimize_shift(data: ShiftData):
    num_instructors = len(data.instructors)
    num_classes = len(data.classes)

    q = Array.create("q", shape=(num_instructors, num_classes), vartype="BINARY")
    H = build_hamiltonian(q, data.instructors, data.classes, data.dummy_instructor)

    model = H.compile()
    bqm = model.to_bqm()

    sampler = neal.SimulatedAnnealingSampler()
    sampleset = sampler.sample(bqm, num_reads=SA_NUM_READS)

    decoded_samples = model.decode_sampleset(sampleset)
    best_sample = min(decoded_samples, key=lambda s: s.energy)

    broken_constraints = best_sample.constraints(only_broken=True)
    if broken_constraints:
        return {
            "status": "infeasible",
            "message": "絶対条件を満たすシフトが見つかりませんでした。",
            "energy": float(best_sample.energy),
            "broken": broken_constraints,
        }

    schedule = decode_schedule(
        best_sample.sample,
        data.instructors,
        data.classes,
        data.dummy_instructor,
    )

    return {
        "status": "success",
        "energy": float(best_sample.energy),
        "schedule": schedule,
    }

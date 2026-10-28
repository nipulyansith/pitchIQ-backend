"""Background orchestration for the existing biomechanics analysis worker."""

import threading
from pathlib import Path


def start_analysis_job(
    *,
    session_id: str,
    user_id: int,
    sessions: dict,
    worker,
    mark_processing,
    mark_completed,
    mark_failed,
    results_dir: Path,
    save_metric,
    save_file,
) -> bool:
    """Start the existing worker and persist its lifecycle status."""
    if mark_processing(session_id, user_id) is None:
        return False

    active = sessions.get(session_id)
    if active is not None:
        active["status"] = "processing"
        active["progress"] = 0
        active["error"] = None

    thread = threading.Thread(
        target=_run_analysis_job,
        args=(session_id, user_id, sessions, worker, mark_completed, mark_failed, results_dir, save_metric, save_file),
        daemon=True,
    )
    thread.start()
    return True


def _run_analysis_job(
    session_id,
    user_id,
    sessions,
    worker,
    mark_completed,
    mark_failed,
    results_dir,
    save_metric,
    save_file,
):
    """Run the unchanged worker and translate its outcome to DB status."""
    try:
        worker(session_id)
        active = sessions.get(session_id)
        if active and active.get("status") == "completed":
            result_folder = active.get("result_folder", session_id)
            result_dir = results_dir / result_folder
            persist_analysis_outputs(
                session_id=session_id,
                user_id=user_id,
                results=active.get("results") or {},
                result_dir=result_dir,
                save_metric=save_metric,
                save_file=save_file,
            )
            mark_completed(session_id, user_id, str(results_dir / result_folder))
            return

        error_message = (active or {}).get("error") or "Analysis failed"
        mark_failed(session_id, user_id, error_message)
    except Exception as error:
        mark_failed(session_id, user_id, str(error))


def persist_analysis_outputs(
    *,
    session_id: str,
    user_id: int,
    results: dict,
    result_dir: Path,
    save_metric,
    save_file,
) -> None:
    """Persist collected metric JSON and generated output files."""
    metric_names = {
        "stride_duration",
        "delivery_stride",
        "elbow_flexion",
        "knee_flexion",
        "head_position",
        "wrist_velocity",
    }
    for metric_name in metric_names:
        raw_result = results.get(metric_name)
        if raw_result is None:
            continue
        save_metric(
            session_id,
            user_id,
            metric_name,
            raw_result=raw_result,
            status="measured",
        )

    if not result_dir.exists():
        return
    for generated_path in result_dir.rglob("*"):
        if not generated_path.is_file() or "work" in generated_path.parts:
            continue
        relative_path = generated_path.relative_to(result_dir).as_posix()
        save_file(
            session_id,
            user_id,
            relative_path,
            str(generated_path),
        )

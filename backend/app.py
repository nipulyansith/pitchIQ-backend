"""
FastBowl Lab - Backend Integration Server
==========================================
Integrates frontend UI with biomechanics analysis pipeline
"""

import os
import sys
import json
import uuid
import cv2
import subprocess
import shutil
from pathlib import Path

# Force UTF-8 output so emoji in print statements don't crash on Windows,
# where stdout defaults to the cp1252 codepage in some terminals/launchers.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
import threading
from functools import wraps
import pandas as pd
import numpy as np

# Persistent database is introduced alongside the existing in-memory sessions.
# The current SESSIONS dictionary remains active during the migration.
from backend.database import (
    create_analysis_session,
    delete_analysis_session,
    get_athlete,
    get_analysis_session,
    get_generated_files,
    get_metric_results,
    get_user_by_id,
    initialize_database,
    list_analysis_sessions,
    mark_session_completed,
    mark_session_failed,
    mark_session_processing,
    upsert_generated_file,
    upsert_metric_result,
    upsert_calibration,
    update_session_progress,
    update_analysis_session,
)
from backend.routes.auth import auth_bp
from backend.routes.analysis import create_analysis_blueprint
from backend.routes.athletes import create_athletes_blueprint
from backend.routes.sessions import create_sessions_blueprint
from backend.services.analysis_service import start_analysis_job

# ============================================================================
# Custom JSON Encoder to handle NaN and Infinity values
# ============================================================================
class SafeJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles NaN, Infinity, and -Infinity"""
    def encode(self, o):
        if isinstance(o, float):
            if np.isnan(o):
                return 'null'
            elif np.isinf(o):
                return 'null'
        return super().encode(o)
    
    def iterencode(self, o, _one_shot=False):
        """Encode the given object and yield each string representation as available."""
        for chunk in super().iterencode(o, _one_shot):
            yield chunk
    
    def default(self, o):
        if isinstance(o, np.ndarray):
            return o.tolist()
        if isinstance(o, (np.integer, np.floating)):
            if np.isnan(o) or np.isinf(o):
                return None
            return float(o)
        return super().default(o)

def sanitize_for_json(obj):
    """Recursively replace NaN and Infinity values with None"""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif isinstance(obj, np.ndarray):
        return sanitize_for_json(obj.tolist())
    else:
        return obj

# ============================================================================
# Configuration
# ============================================================================
app = Flask(__name__)
app.json_encoder = SafeJSONEncoder  # Use custom encoder for NaN/Infinity handling
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "development-only-change-this-secret",
)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("FLASK_COOKIE_SECURE", "0") == "1",
)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "supports_credentials": True,
        }
    },
)

app.register_blueprint(auth_bp)

# Ensure the database exists when the current root-level API starts.
initialize_database()


def coach_required(view):
    """Allow analysis operations only for authenticated coach accounts."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        user_id = session.get('user_id')
        user = get_user_by_id(user_id) if user_id else None
        if not user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        if user.get('role') != 'coach':
            return jsonify({'success': False, 'error': 'Player analysis is under development'}), 403
        return view(*args, **kwargs)
    return wrapped


app.register_blueprint(create_athletes_blueprint(coach_required))

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BASE_DIR = PROJECT_ROOT
UPLOAD_DIR = PROJECT_ROOT / "storage" / "uploads"
RESULTS_DIR = PROJECT_ROOT / "storage" / "results"
DATASET_MAKING_DIR = PROJECT_ROOT / "analysis_engine"
FE_DIR = PROJECT_ROOT / "frontend"

UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB

# Session tracking
SESSIONS = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resolve_unique_video_name(video_name_base):
    """
    Ensure video name is unique by adding a number suffix if needed.
    e.g., "My Video" becomes "My Video" if not exists, else "My Video 2", "My Video 3", etc.
    """
    if not video_name_base:
        return None
    
    # Clean the name
    video_name_base = str(video_name_base).strip()
    if not video_name_base:
        return None
    
    # Check if folder already exists
    result_path = RESULTS_DIR / video_name_base
    if not result_path.exists():
        return video_name_base
    
    # Find a unique name with a number suffix
    counter = 2
    while True:
        unique_name = f"{video_name_base} {counter}"
        result_path = RESULTS_DIR / unique_name
        if not result_path.exists():
            return unique_name
        counter += 1

def get_session_path(session_id):
    """Get the results path for a session, using result_folder if available"""
    if session_id in SESSIONS:
        result_folder = SESSIONS[session_id].get('result_folder', session_id)
    else:
        result_folder = session_id
    return RESULTS_DIR / result_folder

def create_session(video_name=None):
    """Create a new analysis session"""
    session_id = str(uuid.uuid4())[:8]
    
    # Resolve unique video name if provided
    unique_video_name = None
    if video_name:
        unique_video_name = resolve_unique_video_name(video_name)
    
    # Use video name as folder name if available, otherwise use session_id
    result_folder = unique_video_name if unique_video_name else session_id
    session_path = RESULTS_DIR / result_folder
    session_path.mkdir(exist_ok=True)
    
    SESSIONS[session_id] = {
        'id': session_id,
        'video_name': unique_video_name,
        'result_folder': result_folder,
        'created_at': datetime.now().isoformat(),
        'video_path': None,
        'bowling_arm': None,
        'calibration_top': None,
        'calibration_bottom': None,
        'status': 'created',
        'error': None,
        'progress': 0,
        'results': None
    }
    return session_id

app.register_blueprint(
    create_sessions_blueprint(
        dependencies={
            "create_session": create_session,
            "persist_session": create_analysis_session,
            "validate_athlete": get_athlete,
            "sessions": SESSIONS,
            "results_dir": RESULTS_DIR,
            "sanitize_for_json": sanitize_for_json,
            "get_persisted_session": get_analysis_session,
            "list_persisted_sessions": list_analysis_sessions,
            "delete_persisted_session": delete_analysis_session,
        },
        coach_required=coach_required,
    )
)

app.register_blueprint(
    create_analysis_blueprint(
        dependencies={
            "get_persisted_session": get_analysis_session,
            "update_persisted_session": update_analysis_session,
            "upsert_calibration": upsert_calibration,
            "start_analysis": lambda session_id, user_id: start_analysis_job(
                session_id=session_id,
                user_id=user_id,
                sessions=SESSIONS,
                worker=lambda active_session_id: process_video_async(active_session_id),
                mark_processing=mark_session_processing,
                mark_completed=mark_session_completed,
                mark_failed=mark_session_failed,
                results_dir=RESULTS_DIR,
                save_metric=upsert_metric_result,
                save_file=upsert_generated_file,
            ),
            "update_session_progress": update_session_progress,
            "get_session_path": get_session_path,
            "sanitize_for_json": sanitize_for_json,
            "get_metric_results": get_metric_results,
            "get_generated_files": get_generated_files,
            "sessions": SESSIONS,
            "upload_dir": UPLOAD_DIR,
            "results_dir": RESULTS_DIR,
            "allowed_extensions": ALLOWED_EXTENSIONS,
            "max_file_size": MAX_FILE_SIZE,
        },
        coach_required=coach_required,
    )
)

# ============================================================================
# API Routes - Video Upload
# ============================================================================

# ============================================================================
# API Routes - Analysis Processing
# ============================================================================

def process_video_async(session_id):
    """Process video asynchronously"""
    session = SESSIONS.get(session_id)
    if not session:
        return
    
    try:
        print(f"\n{'='*60}")
        print(f"Starting processing for session: {session_id}")
        print(f"{'='*60}")
        
        session['progress'] = 10
        
        # Prepare parameters
        video_path = session['video_path']
        bowling_arm = session['bowling_arm']
        result_folder = session.get('result_folder', session_id)
        session_path = RESULTS_DIR / result_folder
        
        # Create working directory
        work_dir = session_path / "work"
        work_dir.mkdir(exist_ok=True)
        
        # Copy video to working directory
        work_video = work_dir / f"video.mp4"
        shutil.copy2(video_path, str(work_video))
        
        session['progress'] = 20
        
        print(f"🎬 Video copied to working directory: {work_video}")
        print(f"📊 Calibration Top: {session['calibration_top']}")
        print(f"📊 Calibration Bottom: {session['calibration_bottom']}")
        print(f"📁 Results folder: {result_folder}")
        
        # Run analysis with progress updates
        session['progress'] = 30
        
        run_analysis(
            session_id=session_id,
            video_path=str(work_video),
            bowling_arm=bowling_arm,
            calibration_top=session['calibration_top'],
            calibration_bottom=session['calibration_bottom'],
            output_dir=str(session_path)
        )
        
        session['progress'] = 85
        
        # Collect results
        print(f"📁 Collecting results from {session_path}")
        results = collect_results(session_id)
        
        session['progress'] = 100
        session['status'] = 'completed'
        session['results'] = results
        
        print(f"✅ Processing completed successfully!")
        
    except Exception as e:
        session['status'] = 'error'
        session['error'] = str(e)
        print(f"❌ Error processing session {session_id}: {str(e)}")
        import traceback
        traceback.print_exc()

def run_analysis(session_id, video_path, bowling_arm, calibration_top, 
                  calibration_bottom, output_dir):
    """Run the biomechanics analysis using wrapper script"""
    
    # Get the trial_id (video name / result folder name) from session
    session = SESSIONS.get(session_id)
    trial_id = session.get('result_folder', session_id) if session else session_id
    
    print(f"\n{'='*60}")
    print(f"Starting biomechanics analysis")
    print(f"{'='*60}")
    print(f"Session ID: {session_id}")
    print(f"Trial ID: {trial_id}")
    print(f"Video: {video_path}")
    print(f"Bowling arm: {bowling_arm}")
    print(f"Calibration top: {calibration_top}")
    print(f"Calibration bottom: {calibration_bottom}")
    print(f"Output dir: {output_dir}")
    
    # Use subprocess to run the wrapper script
    env = os.environ.copy()
    env['PYTHONPATH'] = str(DATASET_MAKING_DIR) + os.pathsep + env.get('PYTHONPATH', '')
    env['PYTHONIOENCODING'] = 'utf-8'
    
    # Construct command
    cmd = [
        sys.executable,
        str(DATASET_MAKING_DIR / 'run_analysis_wrapper.py'),
        '--video', video_path,
        '--hand', bowling_arm,
        '--session-id', session_id,
        '--output-dir', output_dir,
        '--calib-top', f"{calibration_top[0]},{calibration_top[1]}",
        '--calib-bottom', f"{calibration_bottom[0]},{calibration_bottom[1]}",
        '--trial-id', trial_id
    ]
    
    print(f"\n🚀 Running command: {' '.join(cmd)}\n")
    
    # Run analysis
    result = subprocess.run(cmd, cwd=str(DATASET_MAKING_DIR), env=env,
                          capture_output=True, text=True, encoding='utf-8', timeout=600)
    
    # Print output for debugging
    if result.stdout:
        print("=== STDOUT ===")
        print(result.stdout)
    
    if result.stderr:
        print("=== STDERR ===")
        print(result.stderr)
    
    # Check result
    if result.returncode != 0:
        raise RuntimeError(f"Analysis failed with return code {result.returncode}: {result.stderr}")
    
    print(f"\n✅ Analysis completed successfully")

def collect_results(session_id):
    """Collect all results from output directory"""
    session = SESSIONS.get(session_id)
    result_folder = session.get('result_folder', session_id) if session else session_id
    session_path = RESULTS_DIR / result_folder
    results = {
        'stride_duration': None,
        'delivery_stride': None,
        'elbow_flexion': None,
        'knee_flexion': None,
        'head_position': None,
        'wrist_velocity': None,
        'keypoint_data': None,
        'videos': {},
        'raw_data': {}
    }
    
    # Try to find and load result files
    try:
        print(f"\n📁 Collecting results from {session_path}")
        
        # Check if analysis_results.json exists (summary from wrapper)
        summary_file = session_path / "analysis_results.json"
        if summary_file.exists():
            print(f"✅ Found analysis summary: {summary_file}")
            with open(summary_file) as f:
                summary = sanitize_for_json(json.load(f))  # Sanitize immediately after loading
                # Extract results from summary using correct key mappings
                if 'results' in summary:
                    r = summary['results']
                    # Map wrapper results keys to frontend expected keys
                    if r.get('cadence'): 
                        results['stride_duration'] = sanitize_for_json(r['cadence'])
                    if r.get('stride'): 
                        results['delivery_stride'] = sanitize_for_json(r['stride'])
                    if r.get('elbow'): 
                        results['elbow_flexion'] = sanitize_for_json(r['elbow'])
                    if r.get('knee'): 
                        knee_data = sanitize_for_json(r['knee'])
                        # Calculate knee_extension if not present
                        # Extension = Release - FFC (positive = straightening toward 180°)
                        if isinstance(knee_data, dict):
                            if 'knee_extension' not in knee_data and 'knee_angle_at_ffc' in knee_data and 'knee_angle_at_release' in knee_data:
                                try:
                                    ffc = float(knee_data['knee_angle_at_ffc'])
                                    release = float(knee_data['knee_angle_at_release'])
                                    knee_data['knee_extension'] = release - ffc
                                except:
                                    pass
                        results['knee_flexion'] = knee_data
                    if r.get('head'): 
                        head_data = sanitize_for_json(r['head'])
                        # Standardize field names: ffc_offset -> head_offset_at_FFC
                        if isinstance(head_data, dict):
                            if 'ffc_offset' in head_data and 'head_offset_at_FFC' not in head_data:
                                head_data['head_offset_at_FFC'] = head_data.pop('ffc_offset')
                            if 'bfc_offset' in head_data and 'head_offset_at_BFC' not in head_data:
                                head_data['head_offset_at_BFC'] = head_data.pop('bfc_offset')
                        results['head_position'] = head_data
                    if r.get('wrist'): 
                        wrist_data = sanitize_for_json(r['wrist'])
                        # Standardize and convert wrist fields
                        if isinstance(wrist_data, dict):
                            # Convert speed_at_release_mps to kmh if needed
                            if 'wrist_speed_at_release_kmh' not in wrist_data and 'speed_at_release_mps' in wrist_data:
                                try:
                                    wrist_data['wrist_speed_at_release_kmh'] = float(wrist_data['speed_at_release_mps']) * 3.6
                                except:
                                    pass
                            # Create ball_speed_proxy structure if needed
                            if 'ball_speed_proxy' not in wrist_data and 'ball_proxy_kmh' in wrist_data:
                                wrist_data['ball_speed_proxy'] = {'kmh': wrist_data['ball_proxy_kmh']}
                        results['wrist_velocity'] = wrist_data
                    
                    print(f"✅ Extracted results from analysis_results.json")
                    for key in ['stride_duration', 'delivery_stride', 'elbow_flexion', 'knee_flexion', 'head_position', 'wrist_velocity']:
                        if results[key]:
                            print(f"   ✓ {key}")
        
        # Backup: Also try loading individual files
        # Wrist velocity
        wrist_metrics = session_path / "wrist_ball_metrics.json"
        if wrist_metrics.exists() and not results['wrist_velocity']:
            print(f"✅ Found wrist metrics (backup): {wrist_metrics}")
            with open(wrist_metrics) as f:
                results['wrist_velocity'] = sanitize_for_json(json.load(f))
        
        # Knee flexion
        knee_csv = session_path / "knee_angles.csv"
        if knee_csv.exists() and not results['knee_flexion']:
            print(f"✅ Found knee angles (backup): {knee_csv}")
            df = pd.read_csv(knee_csv)
            results['knee_flexion'] = sanitize_for_json({
                'data': df.to_dict(orient='list'),
                'image': 'knee_flexion_analysis.png'
            })
        
        # Elbow flexion
        elbow_csv = session_path / "elbow_full_analysis.csv"
        if elbow_csv.exists() and not results['elbow_flexion']:
            print(f"✅ Found elbow analysis (backup): {elbow_csv}")
            df = pd.read_csv(elbow_csv)
            results['elbow_flexion'] = sanitize_for_json({
                'data': df.to_dict(orient='list'),
                'image': 'elbow_full_plots.png'
            })
        
        # Head position / COM
        head_metrics = session_path / "head_metrics.json"
        if head_metrics.exists() and not results['head_position']:
            print(f"✅ Found head metrics (backup): {head_metrics}")
            with open(head_metrics) as f:
                results['head_position'] = sanitize_for_json(json.load(f))
        
        # Keypoint data (skeletal visualization reference)
        keypoint_ref = session_path / "keypoint_samples" / "keypoint_reference.json"
        if keypoint_ref.exists():
            print(f"✅ Found keypoint reference data: {keypoint_ref}")
            with open(keypoint_ref) as f:
                keypoint_data = sanitize_for_json(json.load(f))
                results['keypoint_data'] = keypoint_data
        
        # Videos
        video_count = 0
        for video_file in session_path.glob("*_annotated.mp4"):
            results['videos'][video_file.stem.replace('_annotated', '')] = video_file.name
            video_count += 1
        
        if video_count > 0:
            print(f"✅ Found {video_count} annotated videos")
        
        print(f"✅ Results collection complete")
        print(f"\nFinal results structure:")
        for key, val in results.items():
            if key != 'videos' and key != 'raw_data' and key != 'keypoint_data':
                status = "✅" if val else "❌"
                print(f"  {status} {key}: {type(val).__name__}")
        
        if results.get('keypoint_data'):
            print(f"  ✅ keypoint_data: dict with {len(results['keypoint_data'].get('frames', []))} frames")
        
    except Exception as e:
        print(f"⚠️  Error collecting results: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

# ============================================================================
# API Routes - Results Retrieval
# ============================================================================

@app.route('/api/results/<session_id>/stride', methods=['GET'])
@coach_required
def api_get_stride_results(session_id):
    """Get step duration / stride results"""
    return api_get_analysis_file(session_id, 'step_cadence')

@app.route('/api/results/<session_id>/delivery', methods=['GET'])
@coach_required
def api_get_delivery_results(session_id):
    """Get delivery stride results"""
    return api_get_analysis_file(session_id, 'delivery_stride')

@app.route('/api/results/<session_id>/elbow', methods=['GET'])
@coach_required
def api_get_elbow_results(session_id):
    """Get elbow flexion results"""
    return api_get_analysis_file(session_id, 'elbow_flexion')

@app.route('/api/results/<session_id>/knee', methods=['GET'])
@coach_required
def api_get_knee_results(session_id):
    """Get knee flexion results"""
    return api_get_analysis_file(session_id, 'knee_flexion')

@app.route('/api/results/<session_id>/com', methods=['GET'])
@coach_required
def api_get_com_results(session_id):
    """Get center of mass / head position results"""
    return api_get_analysis_file(session_id, 'head_position')

@app.route('/api/results/<session_id>/wrist', methods=['GET'])
@coach_required
def api_get_wrist_results(session_id):
    """Get wrist velocity results"""
    return api_get_analysis_file(session_id, 'wrist_velocity')

def api_get_analysis_file(session_id, analysis_type):
    """Generic function to get analysis results"""
    if session_id not in SESSIONS:
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    
    session = SESSIONS[session_id]
    
    if session['status'] != 'completed':
        return jsonify({
            'success': False,
            'error': f'Analysis not completed. Status: {session["status"]}'
        }), 400
    
    results = session.get('results', {})
    if analysis_type not in results:
        return jsonify({
            'success': False,
            'error': f'Results for {analysis_type} not available'
        }), 404
    
    return jsonify({
        'success': True,
        'data': results.get(analysis_type)
    }), 200

# ============================================================================
# API Routes - File Downloads & Media Streaming
# ============================================================================

def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Range, Content-Type, Accept, Authorization'
    return response

@app.route('/api/results/<session_id>/download/<file_type>', methods=['GET'])
def api_download_file(session_id, file_type):
    """Download result files (CSVs, images, videos)"""
    session_path = RESULTS_DIR / session_id
    if not session_path.exists() and session_id in SESSIONS:
        session_path = get_session_path(session_id)
    
    if not session_path.exists():
        return jsonify({'success': False, 'error': 'Session not found'}), 404
    
    file_map = {
        'elbow_csv': 'elbow_full_analysis.csv',
        'elbow_png': 'elbow_full_plots.png',
        'knee_csv': 'knee_angles.csv',
        'knee_png': 'knee_flexion_analysis.png',
        'wrist_csv': 'wrist_timeseries.csv',
        'wrist_png': 'wrist_speed_vs_time.png',
        'head_csv': 'head_metrics.csv',
        'stride_video': 'step_cadence_annotated.mp4',
        'delivery_video': 'delivery_stride_annotated.mp4',
        'elbow_video': 'elbow_flexion_annotated.mp4',
        'knee_video': 'knee_flexion_annotated.mp4',
        'head_video': 'head_position_annotated.mp4',
        'wrist_video': 'wrist_velocity_annotated.mp4',
    }
    
    if file_type not in file_map:
        return jsonify({'success': False, 'error': 'Invalid file type'}), 400
    
    file_path = session_path / file_map[file_type]
    
    if not file_path.exists():
        return jsonify({'success': False, 'error': 'File not found'}), 404
    
    res = send_file(str(file_path), download_name=file_path.name)
    return add_cors_headers(res)

@app.route('/api/results/<session_id>/image/<image_name>', methods=['GET', 'OPTIONS'])
def api_get_image(session_id, image_name):
    """Get analysis image"""
    if request.method == 'OPTIONS':
        return add_cors_headers(app.response_class(status=204))
    
    session_path = RESULTS_DIR / session_id
    image_path = session_path / image_name
    
    if not image_path.exists():
        return jsonify({'success': False, 'error': 'Image not found'}), 404
    
    res = send_file(str(image_path), mimetype='image/png')
    return add_cors_headers(res)

@app.route('/api/results/<session_id>/video/<video_name>', methods=['GET', 'OPTIONS'])
def api_get_video(session_id, video_name):
    """Get analysis video with streaming and range request support"""
    from flask import request
    if request.method == 'OPTIONS':
        return add_cors_headers(app.response_class(status=204))
    
    session_path = RESULTS_DIR / session_id
    video_path = session_path / video_name
    
    if not video_path.exists():
        return jsonify({'success': False, 'error': 'Video not found'}), 404
    
    file_size = video_path.stat().st_size
    
    # Handle range requests for streaming
    range_header = request.headers.get('Range')
    if range_header:
        # Parse the range header (e.g., "bytes=0-1023")
        try:
            range_match = range_header.replace('bytes=', '').split('-')
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            # Clamp values
            start = max(0, start)
            end = min(file_size - 1, end)
            
            # Return 206 Partial Content
            with open(str(video_path), 'rb') as f:
                f.seek(start)
                data = f.read(end - start + 1)
            
            response = app.response_class(
                data,
                206,  # 206 Partial Content
                mimetype='video/mp4',
                direct_passthrough=True
            )
            response.headers['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            response.headers['Content-Length'] = end - start + 1
            response.headers['Accept-Ranges'] = 'bytes'
            response.headers['Content-Type'] = 'video/mp4'
            response.headers['Cache-Control'] = 'public, max-age=86400'
            return add_cors_headers(response)
        except (ValueError, IndexError):
            pass
    
    # Return full file if no range header
    def generate():
        with open(str(video_path), 'rb') as f:
            while True:
                chunk = f.read(8192)  # 8KB chunks
                if not chunk:
                    break
                yield chunk
    
    response = app.response_class(generate(), 200, mimetype='video/mp4')
    response.headers['Accept-Ranges'] = 'bytes'
    response.headers['Content-Type'] = 'video/mp4'
    response.headers['Content-Length'] = file_size
    response.headers['Cache-Control'] = 'public, max-age=86400'
    response.headers['Content-Disposition'] = 'inline; filename=' + video_name
    return add_cors_headers(response)

# ============================================================================
# API Routes - Parameter Insights & Comprehensive Results
# ============================================================================

def resolve_session_insights(session_id=None):
    """Resolve session metadata and 6 parameter insights dictionary dynamically with pure calculations."""
    target_id = session_id
    if not target_id or target_id in ('latest', 'insights'):
        # Find latest completed session directory in RESULTS_DIR
        sessions = [
            d for d in RESULTS_DIR.iterdir()
            if d.is_dir() and (d / "analysis_results.json").exists()
        ]
        if not sessions:
            return None
        sessions.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        target_id = sessions[0].name
    
    session_dir = RESULTS_DIR / target_id
    results_file = session_dir / "analysis_results.json"
    if not results_file.exists():
        return None
    
    try:
        with open(results_file, 'r', encoding='utf-8') as f:
            raw_results = json.load(f)
    except Exception as e:
        print(f"Error reading results JSON for {target_id}: {e}")
        return None

    # Query database for session metadata if available
    db_session = None
    try:
        from backend.database import database_connection
        with database_connection() as conn:
            row = conn.execute("SELECT * FROM analysis_sessions WHERE id = ?", (target_id,)).fetchone()
            if row:
                db_session = dict(row)
    except Exception:
        pass

    fps = float(raw_results.get("fps", 60.0))
    total_frames = int(raw_results.get("total_frames", 0))
    events = raw_results.get("events", {})
    results_data = raw_results.get("results", {})
    cadence = results_data.get("cadence", {})
    stride = results_data.get("stride", {})
    elbow = results_data.get("elbow", {})
    knee = results_data.get("knee", {})
    head = results_data.get("head", {})
    wrist = results_data.get("wrist", {})

    bowling_arm = (db_session.get("bowling_arm") if db_session else None) or raw_results.get("bowling_hand", "R")
    arm_name = "Right" if str(bowling_arm).upper() == "R" else "Left"

    calib = raw_results.get("calibration", {})
    stump_height_m = 0.711
    if db_session:
        try:
            with database_connection() as conn:
                crow = conn.execute("SELECT stump_height_m FROM calibrations WHERE session_id = ?", (target_id,)).fetchone()
                if crow and crow["stump_height_m"]:
                    stump_height_m = float(crow["stump_height_m"])
        except Exception:
            pass

    scale_px_per_m = round(1.0 / float(calib.get("meters_per_pixel")), 1) if calib.get("meters_per_pixel") else None

    # ==========================================
    # 1. Cadence Calculations
    # ==========================================
    last5_frames = cadence.get("last5_frames", [])
    intervals_s = [float(iv) for iv in cadence.get("intervals_s", [])]
    foot_labels = cadence.get("foot_labels", [])
    duration_s = float(cadence.get("duration_s")) if cadence.get("duration_s") is not None else None
    if duration_s is None and len(last5_frames) >= 2 and fps > 0:
        duration_s = (last5_frames[-1] - last5_frames[0]) / fps
    avg_interval_s = float(cadence.get("avg_interval_s")) if cadence.get("avg_interval_s") is not None else None
    if avg_interval_s is None and intervals_s:
        avg_interval_s = sum(intervals_s) / len(intervals_s)
    cadence_rate = (len(last5_frames) / duration_s) if (duration_s and duration_s > 0) else None

    cadence_metrics = [
        {"label": "Run-up Duration", "value": f"{duration_s:.2f} s" if duration_s is not None else "N/A", "highlight": True},
        {"label": "Avg Step Interval", "value": f"{avg_interval_s:.2f} s" if avg_interval_s is not None else "N/A", "highlight": True},
        {"label": "Steps Tracked", "value": f"{len(last5_frames)} steps"},
        {"label": "Step Frequency", "value": f"{cadence_rate:.1f} steps/s" if cadence_rate is not None else "N/A"},
    ]
    cadence_details = [
        {"label": "Step Count", "value": f"{len(last5_frames)} footsteps detected"},
        {"label": "Foot Pattern", "value": " → ".join(f.capitalize() for f in foot_labels) if foot_labels else "N/A"},
        {"label": "Cadence Intervals", "value": ", ".join(f"{iv:.2f}s" for iv in intervals_s) if intervals_s else "N/A"},
        {"label": "Key Contact Frames", "value": ", ".join(str(f) for f in last5_frames) if last5_frames else "N/A"},
    ]

    # ==========================================
    # 2. Stride Calculations
    # ==========================================
    stride_m = float(stride.get("stride_m")) if stride.get("stride_m") is not None else None
    bfc_frame = stride.get("bfc_frame", events.get("bfc_frame"))
    ffc_frame = stride.get("ffc_frame", events.get("ffc_frame"))
    stride_duration_s = float(stride.get("stride_duration_s")) if stride.get("stride_duration_s") is not None else None
    if stride_duration_s is None and bfc_frame and ffc_frame and fps > 0:
        stride_duration_s = (ffc_frame - bfc_frame) / fps
    stride_speed_mps = (stride_m / stride_duration_s) if (stride_m is not None and stride_duration_s and stride_duration_s > 0) else None
    stride_speed_kmh = (stride_speed_mps * 3.6) if stride_speed_mps is not None else None
    stride_ratio_pct = (stride_m / stump_height_m * 100.0) if (stride_m is not None and stump_height_m > 0) else None

    stride_metrics = [
        {"label": "Stride Length", "value": f"{stride_m:.2f} m" if stride_m is not None else "N/A", "highlight": True},
        {"label": "Stride in cm", "value": f"{stride_m * 100:.1f} cm" if stride_m is not None else "N/A", "highlight": True},
        {"label": "Stride Duration", "value": f"{stride_duration_s:.2f} s" if stride_duration_s is not None else "N/A"},
        {"label": "Base Ratio", "value": f"{stride_ratio_pct:.0f}% of stump" if stride_ratio_pct is not None else "N/A"},
    ]
    stride_details = [
        {"label": "Back Foot Contact (BFC)", "value": f"Frame {bfc_frame} ({stride.get('b_side', 'right').capitalize()} foot)" if bfc_frame else "N/A"},
        {"label": "Front Foot Contact (FFC)", "value": f"Frame {ffc_frame} ({stride.get('f_side', 'left').capitalize()} foot)" if ffc_frame else "N/A"},
        {"label": "Stride Phase Time", "value": f"{stride_duration_s:.3f} seconds" if stride_duration_s is not None else "N/A"},
        {"label": "Horizontal Approach Speed", "value": f"{stride_speed_mps:.2f} m/s ({stride_speed_kmh:.1f} km/h)" if stride_speed_mps is not None else "N/A"},
    ]

    # ==========================================
    # 3. Elbow Calculations
    # ==========================================
    elbow_at_release = float(elbow.get("elbow_at_release")) if elbow.get("elbow_at_release") is not None else None
    elbow_at_arm_back = float(elbow.get("elbow_at_arm_back")) if elbow.get("elbow_at_arm_back") is not None else None
    elbow_extension = float(elbow.get("elbow_extension")) if elbow.get("elbow_extension") is not None else None
    if elbow_extension is None and elbow_at_release is not None and elbow_at_arm_back is not None:
        elbow_extension = elbow_at_release - elbow_at_arm_back
    release_frame = elbow.get("release_frame", events.get("release_frame"))
    arm_back_frame = events.get("arm_back_frame")
    angular_rate = None
    if elbow_extension is not None and release_frame and arm_back_frame and release_frame > arm_back_frame and fps > 0:
        time_diff = (release_frame - arm_back_frame) / fps
        if time_diff > 0:
            angular_rate = abs(elbow_extension) / time_diff

    elbow_metrics = [
        {"label": "Elbow at Release", "value": f"{elbow_at_release:.1f}°" if elbow_at_release is not None else "N/A", "highlight": True},
        {"label": "Elbow Extension", "value": f"{elbow_extension:.1f}°" if elbow_extension is not None else "N/A", "highlight": True},
        {"label": "Arm Back Angle", "value": f"{elbow_at_arm_back:.1f}°" if elbow_at_arm_back is not None else "N/A"},
        {"label": "Bowling Arm", "value": f"{elbow.get('arm', 'right').capitalize()} Arm"},
    ]
    elbow_details = [
        {"label": "Ball Release Instant", "value": f"Frame {release_frame}" if release_frame else "N/A"},
        {"label": "Arm Cocked (Backswing)", "value": f"{elbow_at_arm_back:.1f}° (Frame {arm_back_frame})" if elbow_at_arm_back is not None else "N/A"},
        {"label": "Elbow Angle at Release", "value": f"{elbow_at_release:.1f}°" if elbow_at_release is not None else "N/A"},
        {"label": "Extension Sweep Rate", "value": f"{angular_rate:.0f}°/s" if angular_rate is not None else f"{elbow_extension:.1f}° total arc" if elbow_extension is not None else "N/A"},
    ]

    # ==========================================
    # 4. Knee Calculations
    # ==========================================
    knee_at_ffc = float(knee.get("knee_angle_at_ffc")) if knee.get("knee_angle_at_ffc") is not None else None
    knee_at_release = float(knee.get("knee_angle_at_release")) if knee.get("knee_angle_at_release") is not None else None
    knee_extension = float(knee.get("knee_extension")) if knee.get("knee_extension") is not None else None
    if knee_extension is None and knee_at_release is not None and knee_at_ffc is not None:
        knee_extension = knee_at_release - knee_at_ffc
    brace_quality = "Firm Extended Brace" if (knee_at_release and knee_at_release >= 165) else ("Moderate Flexion" if (knee_at_release and knee_at_release >= 150) else "Deep Flexion")

    knee_metrics = [
        {"label": "Knee Angle at FFC", "value": f"{knee_at_ffc:.1f}°" if knee_at_ffc is not None else "N/A", "highlight": True},
        {"label": "Knee at Release", "value": f"{knee_at_release:.1f}°" if knee_at_release is not None else "N/A", "highlight": True},
        {"label": "Brace Delta", "value": f"{knee_extension:+.1f}°" if knee_extension is not None else "N/A"},
        {"label": "Brace Classification", "value": brace_quality},
    ]
    knee_details = [
        {"label": "Landing Angle (FFC)", "value": f"{knee_at_ffc:.1f}°" if knee_at_ffc is not None else "N/A"},
        {"label": "Ball Release Angle", "value": f"{knee_at_release:.1f}°" if knee_at_release is not None else "N/A"},
        {"label": "Lead Bracing Leg", "value": f"{knee.get('kside', 'left').capitalize()} Leg"},
        {"label": "Knee Joint Delta", "value": f"{knee_extension:+.1f}° change" if knee_extension is not None else "0.0°"},
    ]

    # ==========================================
    # 5. Head Calculations
    # ==========================================
    ffc_offset = head.get("head_offset_at_FFC", {})
    bfc_offset = head.get("head_offset_at_BFC", {})
    ffc_dx = float(ffc_offset.get("Dx_cm")) if ffc_offset.get("Dx_cm") is not None else None
    ffc_dy = float(ffc_offset.get("Dy_cm")) if ffc_offset.get("Dy_cm") is not None else None
    ffc_d = float(ffc_offset.get("D_cm")) if ffc_offset.get("D_cm") is not None else None
    if ffc_d is None and ffc_dx is not None and ffc_dy is not None:
        ffc_d = (ffc_dx**2 + ffc_dy**2) ** 0.5
    bfc_dx = float(bfc_offset.get("Dx_cm")) if bfc_offset.get("Dx_cm") is not None else None
    lateral_drift = abs(ffc_dx - bfc_dx) if (ffc_dx is not None and bfc_dx is not None) else None

    head_metrics = [
        {"label": "Offset at FFC (Dx)", "value": f"{abs(ffc_dx):.1f} cm" if ffc_dx is not None else "N/A", "highlight": True},
        {"label": "Total Dist at FFC", "value": f"{ffc_d:.1f} cm" if ffc_d is not None else "N/A", "highlight": True},
        {"label": "Offset at BFC (Dx)", "value": f"{abs(bfc_dx):.1f} cm" if bfc_dx is not None else "N/A"},
        {"label": "Lateral Head Drift", "value": f"{lateral_drift:.1f} cm" if lateral_drift is not None else "N/A"},
    ]
    head_details = [
        {"label": "FFC Lateral Offset (Dx)", "value": f"{ffc_dx:.1f} cm" if ffc_dx is not None else "N/A"},
        {"label": "FFC Vertical Offset (Dy)", "value": f"{ffc_dy:.1f} cm" if ffc_dy is not None else "N/A"},
        {"label": "BFC Lateral Offset (Dx)", "value": f"{bfc_dx:.1f} cm" if bfc_dx is not None else "N/A"},
        {"label": "Base Ankle Landmark", "value": head.get("front_ankle", "left_ankle").replace("_", " ").capitalize()},
    ]

    # ==========================================
    # 6. Wrist Calculations
    # ==========================================
    speed_mps = float(wrist.get("speed_at_release_mps")) if wrist.get("speed_at_release_mps") is not None else None
    speed_kmh = float(wrist.get("wrist_speed_at_release_kmh")) if wrist.get("wrist_speed_at_release_kmh") is not None else ((speed_mps * 3.6) if speed_mps is not None else None)
    peak_mps = float(wrist.get("peak_speed_overall_mps")) if wrist.get("peak_speed_overall_mps") is not None else speed_mps
    peak_kmh = (peak_mps * 3.6) if peak_mps is not None else speed_kmh
    ang_rads = float(wrist.get("peak_angular_vel_rads")) if wrist.get("peak_angular_vel_rads") is not None else None
    ang_degs = (abs(ang_rads) * (180.0 / 3.14159265359)) if ang_rads is not None else None

    wrist_metrics = [
        {"label": "Release Speed", "value": f"{speed_kmh:.1f} km/h" if speed_kmh is not None else "N/A", "highlight": True},
        {"label": "Linear Velocity", "value": f"{speed_mps:.1f} m/s" if speed_mps is not None else "N/A", "highlight": True},
        {"label": "Peak Wrist Velocity", "value": f"{peak_kmh:.1f} km/h" if peak_kmh is not None else "N/A"},
        {"label": "Peak Angular Velocity", "value": f"{ang_rads:.1f} rad/s" if ang_rads is not None else "N/A"},
    ]
    wrist_details = [
        {"label": "Ball Proxy Speed", "value": f"{speed_kmh:.1f} km/h ({speed_mps:.1f} m/s)" if speed_kmh is not None else "N/A"},
        {"label": "Ball Release Instant", "value": f"Frame {wrist.get('release_frame', release_frame)}" if (wrist.get('release_frame') or release_frame) else "N/A"},
        {"label": "Peak Velocity Near Release", "value": f"{peak_mps:.1f} m/s ({peak_kmh:.1f} km/h)" if peak_mps is not None else "N/A"},
        {"label": "Rotational Arm Velocity", "value": f"{ang_degs:.0f}°/s ({ang_rads:.1f} rad/s)" if ang_degs is not None else "N/A"},
    ]

    parameters = {
        "cadence": {
            "id": "cadence",
            "name": "Run-up Cadence",
            "shortName": "Cadence",
            "summary": "Rhythm and time spacing of the final approach steps.",
            "video": f"/api/results/{target_id}/video/step_cadence_annotated.mp4",
            "videoName": "step_cadence_annotated.mp4",
            "metrics": cadence_metrics,
            "details": cadence_details,
            "coachingTip": "Consistent acceleration and controlled cadence through the final five steps create smooth momentum transfer into the crease."
        },
        "stride": {
            "id": "stride",
            "name": "Delivery Stride",
            "shortName": "Stride",
            "summary": "Base length from back foot contact (BFC) to front foot contact (FFC).",
            "video": f"/api/results/{target_id}/video/delivery_stride_annotated.mp4",
            "videoName": "delivery_stride_annotated.mp4",
            "metrics": stride_metrics,
            "details": stride_details,
            "coachingTip": "An optimal delivery stride allows stable deceleration without collapsing the front knee or overstriding."
        },
        "elbow": {
            "id": "elbow",
            "name": "Elbow Flexion",
            "shortName": "Elbow",
            "summary": "Angle and extension of the bowling arm from cocking to release.",
            "video": f"/api/results/{target_id}/video/elbow_flexion_annotated.mp4",
            "videoName": "elbow_flexion_annotated.mp4",
            "plot": f"/api/results/{target_id}/image/elbow_full_plots.png",
            "metrics": elbow_metrics,
            "details": elbow_details,
            "coachingTip": "Monitoring elbow extension ensures legal bowling compliance (ICC 15° threshold for elbow straightening in delivery arc) and arm swing efficiency."
        },
        "knee": {
            "id": "knee",
            "name": "Front Knee Flexion",
            "shortName": "Knee",
            "summary": "Lead knee brace and extension angle upon front-foot landing.",
            "video": f"/api/results/{target_id}/video/knee_flexion_annotated.mp4",
            "videoName": "knee_flexion_annotated.mp4",
            "plot": f"/api/results/{target_id}/image/knee_flexion_analysis.png",
            "metrics": knee_metrics,
            "details": knee_details,
            "coachingTip": "A firm front knee brace (>165°) converts run-up linear momentum into rapid rotational and trunk propulsion."
        },
        "head": {
            "id": "head",
            "name": "Head Stability",
            "shortName": "Head",
            "summary": "Center of mass and head lateral stability aligned with base of support.",
            "video": f"/api/results/{target_id}/video/head_position_annotated.mp4",
            "videoName": "head_position_annotated.mp4",
            "plot": f"/api/results/{target_id}/image/headDx_vs_time.png",
            "metrics": head_metrics,
            "details": head_details,
            "coachingTip": "Keeping the head steady and aligned over the base of support improves release accuracy and reduces spinal counter-rotation."
        },
        "wrist": {
            "id": "wrist",
            "name": "Wrist Velocity",
            "shortName": "Wrist",
            "summary": "Linear speed and angular velocity of the release point.",
            "video": f"/api/results/{target_id}/video/wrist_velocity_annotated.mp4",
            "videoName": "wrist_velocity_annotated.mp4",
            "plot": f"/api/results/{target_id}/image/wrist_speed_vs_time.png",
            "metrics": wrist_metrics,
            "details": wrist_details,
            "coachingTip": "Maximum wrist speed at the instant of release directly correlates with ball velocity off the pitch."
        }
    }

    return {
        "session_id": target_id,
        "video_name": (db_session.get("video_name") if db_session else None) or Path(raw_results.get("video", "delivery.mp4")).name,
        "bowling_arm": arm_name,
        "stump_height_m": stump_height_m,
        "scale_pixels_per_m": scale_px_per_m,
        "fps": fps,
        "total_frames": total_frames,
        "events": events,
        "parameter_order": ["cadence", "stride", "elbow", "knee", "head", "wrist"],
        "parameters": parameters,
    }

    return {
        "session_id": target_id,
        "video_name": (db_session.get("video_name") if db_session else None) or Path(raw_results.get("video", "delivery.mp4")).name,
        "bowling_arm": arm_name,
        "stump_height_m": stump_height_m,
        "scale_pixels_per_m": scale_px_per_m,
        "fps": raw_results.get("fps", 60.0),
        "total_frames": raw_results.get("total_frames", 313),
        "events": raw_results.get("events", {}),
        "parameter_order": ["cadence", "stride", "elbow", "knee", "head", "wrist"],
        "parameters": parameters,
    }

@app.route('/api/results/<session_id>/insights', methods=['GET', 'OPTIONS'])
def api_get_session_insights(session_id):
    """Retrieve structured 6 parameter insights and annotated video paths."""
    if request.method == 'OPTIONS':
        return add_cors_headers(app.response_class(status=204))
    
    insights = resolve_session_insights(session_id)
    if not insights:
        return jsonify({'success': False, 'error': f'Insights for session {session_id} not found'}), 404
    
    res = jsonify({'success': True, 'data': sanitize_for_json(insights)})
    return add_cors_headers(res)

@app.route('/api/results/latest/insights', methods=['GET', 'OPTIONS'])
@app.route('/api/results/insights', methods=['GET', 'OPTIONS'])
def api_get_latest_insights():
    """Retrieve the latest completed session insights."""
    if request.method == 'OPTIONS':
        return add_cors_headers(app.response_class(status=204))
    
    insights = resolve_session_insights(None)
    if not insights:
        return jsonify({'success': False, 'error': 'No completed analysis sessions found'}), 404
    
    res = jsonify({'success': True, 'data': sanitize_for_json(insights)})
    return add_cors_headers(res)

@app.route('/api/results/<session_id>/keypoints', methods=['GET'])
@coach_required
def api_get_keypoints(session_id):
    """Get keypoint reference data"""
    session_path = RESULTS_DIR / session_id
    keypoint_ref = session_path / "keypoint_samples" / "keypoint_reference.json"
    
    if not keypoint_ref.exists():
        return jsonify({'success': False, 'error': 'Keypoint data not found'}), 404
    
    try:
        with open(keypoint_ref) as f:
            keypoint_data = sanitize_for_json(json.load(f))
        
        return jsonify({
            'success': True,
            'data': keypoint_data
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/results/<session_id>/keypoint-frame/<frame_label>', methods=['GET'])
@coach_required
def api_get_keypoint_frame(session_id, frame_label):
    """Get annotated keypoint frame image"""
    session_path = get_session_path(session_id)
    keypoint_samples_dir = session_path / "keypoint_samples"
    
    # Find the frame file matching the label
    if not keypoint_samples_dir.exists():
        return jsonify({'success': False, 'error': 'Keypoint samples not found'}), 404
    
    # Search for frame file with the given label
    for frame_file in keypoint_samples_dir.glob(f"keypoints_{frame_label}_frame_*.jpg"):
        return send_file(str(frame_file), mimetype='image/jpeg'), 200
    
    return jsonify({'success': False, 'error': f'Frame {frame_label} not found'}), 404

# ============================================================================
# Frontend Routes
# ============================================================================

@app.route('/', methods=['GET'])
def serve_index():
    """Serve dashboard"""
    return send_from_directory(str(FE_DIR), 'dashboard.html')

@app.route('/<path:filepath>', methods=['GET'])
def serve_static(filepath):
    """Serve static files"""
    return send_from_directory(str(FE_DIR), filepath)

# ============================================================================
# Health Check
# ============================================================================

@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("  FastBowl Lab - Backend Server")
    print("="*60)
    print(f"Upload directory: {UPLOAD_DIR}")
    print(f"Results directory: {RESULTS_DIR}")
    print(f"FE directory: {FE_DIR}")
    print("\nServer starting on http://localhost:5001")
    print("="*60 + "\n")
    
    app.run(debug=False, host='0.0.0.0', port=5001, threaded=True)

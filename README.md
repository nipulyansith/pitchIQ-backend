# PitchIQ backend bundle

This folder is a clean copy of the backend and biomechanics engine. The original
project files remain outside this folder as a fallback.

## Start the backend

From this `PitchIQ` folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-backend.txt
python -m backend.init_db
python -m backend.app
```

The API runs on `http://localhost:5001`.

The React application can be placed in `frontend/` and run separately during
development. The backend stores generated data under `storage/`.

Do not copy the original `.env` file into this bundle. Configure secrets using
environment variables, especially `FLASK_SECRET_KEY`.

# Fraud Detection System

A full-stack fraud detection system combining a Node.js/Express backend, a React+Vite frontend, and a Python FastAPI microservice for model-based predictions.

This project demonstrates how to build an end-to-end analytics application with authentication, transaction scoring, and basic explainability.

## 1. Project Structure

- `backend/`  Node.js/Express API (auth, transaction scoring, history)
- `frontend/`  React + Vite SPA for the web UI
- `python_service/`  FastAPI service exposing a fraud detection endpoint
- `data/`  (optional) small sample dataset such as `creditcard_sample.csv`
- `.gitignore`  ignores virtualenv, node_modules, large datasets, etc.

> **Important**: The full `creditcard.csv` dataset is **not** stored in this repository because it exceeds GitHub's 100 MB file limit. See the **Dataset** section below.

## 2. Technology Stack

- **Backend**: Node.js, Express, MongoDB (or another database, depending on your configuration)
- **Frontend**: React, Vite, Tailwind CSS
- **Model Service**: Python, FastAPI, scikit-learn / heuristics

## 3. Prerequisites

- Node.js (LTS)
- npm or yarn
- Python 3.10+ (with `python` or `py` available in your terminal)
- Git
- A running MongoDB instance (local or remote) if required by the backend configuration

## 4. Getting Started

### 4.1. Clone the repository

```bash
git clone https://github.com/iheb-mha/Fraud-detection-sys.git
cd Fraud-detection-sys
```

### 4.2. Python virtual environment

It is recommended to create a virtual environment in the project root (this folder is ignored by git):

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# or Command Prompt
.\.venv\Scripts\activate.bat
```

Then install Python dependencies for the model service:

```bash
pip install -r python_service/requirements.txt
```

## 5. Running the Services

The system consists of three main parts that can be run in parallel: backend, frontend, and Python model service.

### 5.1. Backend (Node.js / Express)

From the project root:

```bash
cd backend
npm install
npm run dev
```

By default the backend will listen on a port such as `http://localhost:5000` (check `backend/src/server.js` for the exact port and configuration).

### 5.2. Frontend (React + Vite)

Open a new terminal, then from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite will start a dev server (typically at `http://localhost:5173`). The frontend is configured to call the backend API (and indirectly the Python model service) for predictions.

### 5.3. Python Model Service (FastAPI)

In the terminal where your virtual environment is **activated** and from the project root:

```bash
cd python_service
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

This exposes:

- `GET /health`  health check
- `POST /predict`  accepts a JSON payload with transaction features and returns fraud probability and label.

The Node.js backend proxies to this service from an endpoint like `/api/predict-model` (see `backend/src/server.js`).

## 6. Dataset

### 6.1. Full dataset (`creditcard.csv`)

The original credit card fraud dataset file `creditcard.csv` is **not included** in the repository because its size (~144 MB) exceeds GitHub's single-file limit (100 MB).

To use the full dataset locally:

1. Download `creditcard.csv` from the source you were given (e.g. course material or Kaggle).
2. Place the file in the project root (same level as `backend/`, `frontend/`, `python_service/`).
3. Ensure any local analysis or training scripts that refer to `creditcard.csv` point to this path.

> This file is intentionally ignored by git so it remains only on your machine.

### 6.2. Sample dataset (`data/creditcard_sample.csv`)

For demonstration and testing in environments without the full dataset, you can use:

- `data/creditcard_sample.csv`  a small sample file with a few example rows.

You can extend or replace this sample file with a smaller subset of the real dataset if required.

## 7. Environment Variables

Depending on your configuration, the backend may use environment variables such as:

- `PORT`  backend server port
- `MONGO_URI`  MongoDB connection string
- `JWT_SECRET`  secret key for signing authentication tokens
- `PY_MODEL_URL`  URL of the Python FastAPI model service (defaults to `http://127.0.0.1:8000/predict` if not set)

Create a `.env` file in the `backend/` folder, for example:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fraud_detection
JWT_SECRET=replace_with_a_secure_secret
PY_MODEL_URL=http://127.0.0.1:8000/predict
```

> The `.env` file is ignored by git to avoid committing secrets.

## 8. Typical Development Workflow

1. Start MongoDB (if used).
2. Start the Python model service:
   - `cd python_service`
   - `uvicorn server:app --reload --host 127.0.0.1 --port 8000`
3. Start the backend:
   - `cd backend`
   - `npm install` (first time only)
   - `npm run dev`
4. Start the frontend:
   - `cd frontend`
   - `npm install` (first time only)
   - `npm run dev`
5. Open the frontend URL (e.g. `http://localhost:5173`) and log in / register, then submit transactions for fraud scoring.

## 9. Notes

- `.venv/` and `node_modules/` are intentionally **not** tracked by git.
- Large dataset files such as `creditcard.csv` must remain local; use external storage or a smaller subset in `data/` if you need to share examples.
- The Python service currently uses a heuristic-based mock model; you can replace `mock_fraud_detection` in `python_service/server.py` with a trained model loading code if desired.

## 10. License

Add your preferred license information here (for example: MIT or Apache 2.0) if you plan to open-source this project.

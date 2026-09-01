# Transport Management System (TMS)

A full-stack web application designed to manage fleet operations, track drivers, monitor trips (source to destination), and log journey expenses like diesel and tolls. 

This project is built with a modern decoupled architecture using a **FastAPI** backend and a **React (Vite)** frontend, styled with **Tailwind CSS**, and backed by a **PostgreSQL** database.

---

## 🚀 Tech Stack

### Backend
*   **Framework:** FastAPI (Python)
*   **ORM:** SQLAlchemy
*   **Data Validation:** Pydantic
*   **Database:** PostgreSQL (Cloud) / SQLite (Local dev fallback)
*   **Server:** Uvicorn

### Frontend
*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **Routing:** React Router v6
*   **HTTP Client:** Axios

### Deployment
*   **Backend Hosting:** Render (Web Service)
*   **Frontend Hosting:** Render (Static Site)
*   **Database Hosting:** Neon / Supabase (Serverless PostgreSQL)

---

## 📂 Project Structure

```text
tms-app/
│
├── backend/                  
│   ├── main.py               # FastAPI application, CORS, and routing
│   ├── models.py             # SQLAlchemy database schema & DB connection
│   ├── schemas.py            # Pydantic validation models
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # (Git ignored) Database credentials
│
├── frontend/                 
│   ├── index.html            # Main HTML template
│   ├── package.json          # Node dependencies & scripts
│   ├── vite.config.js        # Vite bundler configuration
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   └── src/                  
│       ├── App.jsx           # React Router and main page layouts
│       ├── api.js            # Axios configuration & backend base URL
│       ├── main.jsx          # React entry point
│       └── index.css         # Global styles & Tailwind directives
│
└── README.md                 # Project documentation
```

---

## 💻 Local Development Setup

### Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Git

### 1. Clone the Repository
```bash
git clone https://github.com/Ashish-T/tms-app.git
cd tms-app
```

### 2. Backend Setup
Navigate to the backend directory and set up the Python environment:

```bash
cd backend

# (Optional but recommended) Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment variables file
touch .env
```

Inside the `.env` file, add your PostgreSQL connection string (or leave empty to default to a local `tms.db` SQLite file):
```env
DATABASE_URL=postgresql://user:password@hostname/db_name
```

Start the FastAPI server:
```bash
uvicorn main:app --reload
```
*The backend will be running at `http://127.0.0.1:8000`*  
*Interactive API Docs (Swagger UI) available at `http://127.0.0.1:8000/docs`*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the React app:

```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The frontend will be running at `http://localhost:5173`*

> **Note:** If running locally, ensure `frontend/src/api.js` is pointed to `http://127.0.0.1:8000` instead of the production Render URL.

---

## ☁️ Deployment Guide (Render)

Both the frontend and backend are optimized for deployment on [Render.com](https://render.com).

### Backend Deployment (Web Service)
1. In Render, create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the following settings:
   *   **Root Directory:** `backend`
   *   **Environment:** `Python 3`
   *   **Build Command:** `pip install -r requirements.txt`
   *   **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   *   `DATABASE_URL` = `<your-cloud-postgresql-url>`

### Frontend Deployment (Static Site)
1. In Render, create a new **Static Site**.
2. Connect your GitHub repository.
3. Configure the exact following settings (crucial for Vite/React):
   *   **Root Directory:** `frontend`
   *   **Build Command:** `npm install && npm run build`
   *   **Publish Directory:** `dist`
4. Once deployed, update your `backend/main.py` CORS settings to allow traffic from your new Render frontend URL.

---

## 📡 Core API Endpoints

The backend automatically handles database migrations on startup using `Base.metadata.create_all(bind=engine)`. 

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API Healthcheck / Welcome message |
| `GET` | `/docs` | Swagger UI documentation |
| `GET` | `/drivers/` | Fetch all drivers |
| `POST` | `/drivers/` | Create a new driver |
| `GET` | `/trips/` | Fetch all trips |
| `POST` | `/trips/` | Create a new trip |
| `POST` | `/trips/{trip_id}/expenses/` | Log a new expense (Diesel, Toll, etc.) |
| `GET` | `/trips/{trip_id}/summary` | Get total cost and distance for a specific trip |

---

## 🔒 License
This project is open-source and available under the MIT License.

Need to make changes for deploying new appliation version
1. Create a different supabase database
2, add backend service url to - frontend/src/api.js
3. Change the database credentials in .env file
4. also add the environment variable on render backend service.
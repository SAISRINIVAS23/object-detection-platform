# 🚀 Object Detection Platform

An AI-powered **Object Detection Platform** built using **React.js**, **FastAPI**, **YOLO11n**, and **Supabase**. The platform enables users to detect objects from images, videos, and live webcam streams while securely storing detection history and generated screenshots.

---

## 📌 Project Overview

The Object Detection Platform is a full-stack web application that combines modern web technologies with deep learning to provide accurate and real-time object detection. It offers a user-friendly interface for uploading media, performing AI-based detection, and managing previous detection results through a secure dashboard.

---

## ✨ Features

* 🔐 User Authentication (JWT)
* 👤 User Registration & Login
* 📊 Interactive Dashboard
* 🖼️ Image Object Detection
* 🎥 Video Object Detection
* 📷 Real-Time Webcam Detection
* 🤖 YOLO11n AI Model Integration
* 📜 Detection History
* 🖼️ Screenshot Gallery
* ☁️ Supabase Database Integration
* 📱 Responsive User Interface

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* React Router
* Axios
* CSS

### Backend

* FastAPI
* Python
* SQLAlchemy
* JWT Authentication
* Uvicorn

### Artificial Intelligence

* YOLO11n (Ultralytics)
* OpenCV
* PyTorch

### Database

* Supabase (PostgreSQL)

### Deployment

* Frontend: Vercel
* Backend: Render

---

## 📂 Project Structure

```
object-detection-platform/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   ├── requirements.txt
│   └── main.py
│
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/SAISRINIVAS23/object-detection-platform.git
cd object-detection-platform
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env)

```env
VITE_API_URL=https://object-detection-platform.onrender.com
```

---

## Application Workflow

1. User registers or logs in.
2. JWT authentication secures user access.
3. User uploads an image or video, or starts webcam detection.
4. YOLO11n processes the media and detects objects.
5. Detection results and screenshots are stored in Supabase.
6. Users can view previous detections in the Detection History.
7. Screenshots are available in the Gallery.

---

## API Endpoints

### Authentication

* POST `/register`
* POST `/login`

### Detection

* POST `/detect/image`
* POST `/detect/video`
* POST `/detect/webcam`

### Dashboard

* GET `/dashboard`

### History

* GET `/history`

### Gallery

* GET `/gallery`

---

## Screenshots

Add screenshots of the following pages:

* Login Page
* Registration Page
* Dashboard
* Image Detection
* Video Detection
* Webcam Detection
* Detection History
* Gallery

---

## Future Enhancements

* Multiple AI model support
* Live object tracking
* PDF report generation
* Detection analytics dashboard
* Email notifications
* Mobile application
* Cloud storage integration

---

## Deployment

### Frontend

Deployed using **Vercel**

### Backend

Deployed using **Render**

---

## Author

**Akula Sai Srinivas**

* 🎓 B.Tech – Information Technology
* 💻 Aspiring Full-Stack & AI Developer
* 📧 Email: [saisrinivas5121916@gmail.com](mailto:saisrinivas5121916@gmail.com)
* 🔗 GitHub: https://github.com/SAISRINIVAS23

---

## License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful:

* ⭐ Star this repository
* 🍴 Fork the repository
* 🤝 Contribute to improve the project

Your support is greatly appreciated!

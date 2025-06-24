# 🚗 Driving School Management System (DRIVING-MS)

A full-stack web application to manage a driving school's operations — from student registration and instructor scheduling to bookings, analytics, and admin controls.

Built with 💻 **React (Vite)** + 🛠️ **Express.js** + 🍃 **MongoDB**

---

## 🌟 Features

### 👤 Student Features
- Register & login
- Book driving lessons
- View personal progress
- Get notified of upcoming lessons

### 🧑‍🏫 Instructor Features
- Manage assigned lessons
- Track student progress
- View own schedule

### 🛡️ Admin Features
- Manage students, instructors, and bookings
- Assign instructors to lessons
- Track analytics & completion rates
- View payment & booking reports
- Send announcements & configure settings

---

## 🧱 Project Structure

driving-school-ms/
├── client/ # Frontend (React + Vite)
│ ├── public/
│ ├── src/
│ │ ├── api/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── hooks/
│ │ ├── context/
│ │ ├── App.tsx
│ │ └── main.tsx
│ └── vite.config.ts
│
├── server/ # Backend (Express + MongoDB)
│ ├── models/
│ ├── controllers/
│ ├── routes/
│ ├── middlewares/
│ ├── utils/
│ ├── config/
│ ├── server.js
│ └── .env
│
├── .gitignore
├── package.json
└── README.md


---

## 🚀 Getting Started

### 📦 Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Vite (included via dev dependencies)

---

### 🛠️ Installation

```bash
# Clone the repo
git clone https://github.com/your-username/driving-school-ms.git
cd driving-school-ms

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# ⚙️ Environment Variables

Inside `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/driving-school-ms
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

---

## 🧪 Run the App

### Start the backend:
```bash
cd server
npm run dev
```

### Start the frontend:
```bash
cd client
npm run dev
```

The app will run at: [http://localhost:5173](http://localhost:5173)

---

## 📊 Admin Dashboard

- View key analytics: total students, instructors, completion rate  
- Manage users, bookings, and lessons  
- Assign instructors  
- Track payment statuses  
- Send system announcements

---

## 🛡️ Authentication

- JWT-based Auth  
- Role-based access (`student`, `instructor`, `admin`)  
- Protected routes on both frontend and backend

---

## 🧠 Technologies Used

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router DOM  
- **Backend**: Node.js + Express + Mongoose  
- **Database**: MongoDB  
- **Auth**: JWT  
- **State Management**: Context API  
- **Form Handling**: React Hooks + Controlled Inputs

---

## 🧰 Future Improvements

- Upload profile pictures  
- Payment integration (M-Pesa, Stripe, etc.)  
- Instructor availability calendar  
- Lesson reminders via email/SMS  
- Admin audit logs & system logs

---

## 👨‍💻 Author

**Venom**  
_Maseno University · nIT Student_  
Built with ❤️ and sleepless nights 😅

---

## 📄 License

This project is licensed under the MIT License — feel free to fork, clone, and enhance!


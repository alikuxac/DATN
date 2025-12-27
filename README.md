# 🆘 Cuu Tro VN - Disaster Response & Coordination Platform

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/stack-NestJS_React_Native_NextJS-orange.svg)

> **Capstone Project (Đồ án Tốt nghiệp)**
> A comprehensive real-time rescue coordination system designed to connect victims in disaster zones with rescue teams and administrators.

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

---

## 🔭 Overview

In emergency situations, communication and location accuracy are vital. **Cuu Tro VN** provides a seamless flow of information between:
1.  **Victims (Mobile App):** Send SOS signals, share real-time location, and access survival guides offline.
2.  **Administrators (Web Dashboard):** Monitor incidents on a live map, verify requests, and coordinate rescue efforts.

The system utilizes **Socket.io** for low-latency communication and **Geo-spatial queries** for precise location tracking.

---

## ✨ Key Features

### 📱 Mobile App (User)
- **SOS Alert:** One-tap emergency signal sending via WebSocket.
- **Real-time Tracking:** Continuous background location updates (optimized for battery).
- **Offline Mode:** Access survival handbooks and cached maps without internet.
- **Bi-directional Communication:** Receive status updates on rescue requests.
- **Multi-language Support:** English & Vietnamese (i18n).

### 🖥️ Web Admin (Dashboard)
- **Live Operations Map:** Visualize all SOS signals and user movements in real-time.
- **Incident Management:** Verify, assign, and resolve rescue requests.
- **Broadcast Notifications:** Send warnings to specific geographic regions (Geofencing).
- **User Management:** Monitor active users and rescue teams.

---

## 🏗 System Architecture

This project is built as a **Monorepo** using [Turborepo](https://turbo.build/), ensuring shared type safety and unified dependency management.

| Application | Path | Description |
| :--- | :--- | :--- |
| **API** | `apps/api` | NestJS Backend (REST API + WebSocket Gateway) |
| **Mobile** | `apps/native` | React Native (Expo) iOS/Android App |
| **Web** | `apps/web` | Next.js Admin Dashboard |
| **Shared** | `packages/shared` | Shared TypeScript interfaces, DTOs, and Enums |

---

## 🛠 Tech Stack

- **Monorepo Tool:** Turborepo, Yarn Workspaces
- **Backend:** NestJS, MongoDB (Mongoose), Socket.io, Redis, Docker
- **Mobile:** React Native, Expo, NativeWind (TailwindCSS), Expo Location
- **Frontend:** Next.js, React Query, Mapbox/Google Maps API
- **DevOps:** Docker Compose, GitHub Actions (CI/CD)

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Yarn
- Docker & Docker Compose (optional for local DB)
- Expo Go (for mobile testing)

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/resq-project.git](https://github.com/your-username/resq-project.git)
cd resq-project
```
Install dependencies:

```bash
  yarn install
```

Environment Setup:
Copy .env.example to .env in apps/api, apps/native, and apps/web.

Update your MongoDB URI and API Keys.

Run the development server:

```bash
# Run all apps simultaneously
yarn dev
```

📂 Project Structure
```Bash

.
├── apps
│   ├── api          # NestJS Backend Application
│   ├── native       # React Native Mobile Application
│   └── web          # Next.js Admin Dashboard
├── packages
│   ├── eslint-config # Shared ESLint configurations
│   ├── shared       # Shared types, constants, utils
│   └── typescript-config # Shared TSConfig
├── package.json
├── turbo.json
└── yarn.lock
```
✍️ Author
Alikuxac

Role: Full-stack Developer

Contact: admin@alikuxac.xyz


---

### 2. Nội dung "About Us" (Dành cho màn hình App/Web)

Đây là nội dung bạn có thể đặt vào màn hình `AboutScreen.tsx` trong Mobile App hoặc trang giới thiệu trên Web Admin.

#### 🅰️ Version Ngắn gọn (Dành cho Mobile App)

**Title:** About ResQ

**Content:**

> **Our Mission**
> ResQ was created with a single mission: to bridge the gap between victims and rescue teams during natural disasters. We believe that technology can save lives by providing accurate, real-time information when it matters most.
>
> **What We Do**
> * **Emergency Alerts:** Send instant SOS signals with your precise location.
> * **Stay Connected:** Keep rescue teams updated on your status.
> * **Be Prepared:** Access vital survival guides even without an internet connection.
>
> **The Project**
> This application is developed as a Capstone Project by students from **[Your University Name]**. We are dedicated to building a robust, community-driven platform for disaster response.
>
> **Version:** 1.0.0
> **Developed by:** [Your Name]

---

#### 🅱️ Version Chi tiết (Dành cho Web hoặc Báo cáo)

**Title:** About the Project

**Content:**

> **Overview**
> "ResQ" is a specialized Disaster Response Coordination Platform designed to address the critical challenges of communication and logistics during emergencies. In the chaotic aftermath of natural disasters, traditional communication channels often fail, and locating victims becomes a race against time. ResQ solves this by leveraging real-time tracking technology and an offline-first architecture.
>
> **Core Value Proposition**
> 1.  **Speed:** By utilizing WebSocket technology, distress signals reach the command center in milliseconds.
> 2.  **Precision:** Advanced geolocation tracking helps rescue teams pinpoint victim locations with high accuracy, reducing search time.
> 3.  **Resilience:** The system is built to function under unstable network conditions, ensuring that crucial information is synced as soon as connectivity is restored.
>
> **Development Team**
> This project represents the culmination of our academic journey at **[Your University Name]**. It demonstrates the practical application of modern software engineering principles—from Microservices and Real-time Systems to Mobile Development—to solve real-world problems.
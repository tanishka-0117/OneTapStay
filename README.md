# OneTapStay

### Unified Guest Identity & Smart Hospitality Platform

**Hack Genesis 2025 • Team Tech_recons**

---

## Overview

Modern hospitality experiences are still fragmented. Guests repeatedly share the same information for check-in, room access, Wi-Fi, dining, spa bookings, payments, and loyalty programs. This creates friction, delays, and an impersonal stay. Hotels, meanwhile, operate with disconnected systems that limit personalization, analytics, and operational efficiency.

**OneTapStay** solves this by creating a **single digital guest identity** that connects every hotel service into one seamless platform. From arrival to departure, guests enjoy a personalized, contactless experience while hotels gain real-time operational visibility and actionable insights.

---

## Problem Statement

### Guest Challenges

* Multiple logins and repeated form filling
* Separate systems for room access, Wi-Fi, dining, and billing
* Slow service requests and communication gaps
* Limited personalization during the stay

### Hotel Challenges

* Siloed guest data across departments
* Manual workflows and operational inefficiencies
* Inconsistent guest experience
* Limited analytics for revenue and service optimization

---

## Solution

OneTapStay acts as a **unified hospitality operating layer** that connects guests, hotel services, and management systems through a secure digital identity.

### Guest Journey

1. **Pre-arrival**: Digital verification and express check-in
2. **Arrival**: QR/NFC room access without front-desk waiting
3. **Stay**: Personalized recommendations and instant service requests
4. **Payments**: Unified digital wallet and consolidated billing
5. **Checkout**: One-tap checkout with digital invoice
6. **Post-stay**: Loyalty points automatically updated

---

# Key Features

## For Guests

### Single Digital Identity

One secure profile works across all hotel services.

### Contactless Room Access

QR code and NFC-based entry for rooms and hotel facilities.

### AI-Powered Personalization

Smart recommendations for dining, spa, events, and activities based on preferences and behavior.

### Integrated Digital Wallet

View all charges in one place and pay seamlessly.

### Real-Time Service Requests

Instant housekeeping, maintenance, concierge, and room-service requests.

### Loyalty Integration

Automatic points tracking, rewards, and membership recognition across properties.

---

## For Hotels

### 360° Guest Dashboard

Unified view of guest preferences, stay history, spending patterns, and service interactions.

### Unified Service Management

Coordinate housekeeping, dining, spa, concierge, and maintenance from a single platform.

### Real-Time Analytics

Occupancy trends, guest satisfaction metrics, service response times, and revenue insights.

### Automated Workflows

Reduce manual errors with automated check-in, billing, notifications, and service routing.

### Cross-Property Recognition

Guest history follows across hotel chains for consistent personalized experiences.

---

# System Architecture

## Frontend

* **Next.js (React.js)**
* **Tailwind CSS**
* Progressive Web App (PWA)
* Mobile-first responsive design

## Backend

* **FastAPI (Python)** or **Node.js + Express.js**
* RESTful APIs
* Socket.IO / WebSockets for real-time communication
* Microservices-ready architecture

## Database & Storage

* **PostgreSQL** — guest profiles, bookings, billing
* **MongoDB** — activity logs, recommendations, events
* **Redis** — caching, sessions, OTPs, rate limiting
* Secure object storage for documents and invoices

## Integrations

* PMS APIs (Opera, IDS, Cloudbeds, etc.)
* POS systems
* Wi-Fi authentication (RADIUS)
* Payment gateways (Razorpay, Stripe)
* CRM and loyalty platforms

---

# High-Level Architecture

```text
Guest App (PWA / Mobile)
        |
        v
API Gateway
        |
------------------------------------------------
| Auth Service | Guest Service | Booking Service |
| Wallet Service | Recommendation Engine        |
------------------------------------------------
        |
------------------------------------------------
| PostgreSQL | MongoDB | Redis | File Storage |
------------------------------------------------
        |
PMS / POS / Payment / Wi-Fi / CRM Integrations
```

---

# Security & Privacy

Security is treated as a first-class requirement.

* OAuth 2.0 / JWT authentication
* Role-based access control (RBAC)
* End-to-end HTTPS encryption
* Encrypted payment and personally identifiable information (PII)
* Device session management
* Audit logs for all critical actions
* GDPR-inspired privacy controls and consent management

---

# AI Personalization Engine

The recommendation engine uses:

* Stay history
* Dining preferences
* Spa and activity usage
* Time of day and occupancy context
* Loyalty tier and spending patterns

### Example

A guest who frequently books spa sessions and vegetarian meals receives:

* Spa appointment suggestions
* Vegetarian restaurant recommendations
* Wellness package offers

---

# Real-Time Features

Powered by WebSockets / Socket.IO:

* Instant service request updates
* Staff assignment notifications
* Order status tracking
* Live chat with concierge
* Emergency broadcast notifications

---

# Tech Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Frontend   | Next.js, React, Tailwind CSS |
| Backend    | FastAPI / Node.js, Express   |
| Realtime   | Socket.IO / WebSockets       |
| Database   | PostgreSQL, MongoDB          |
| Cache      | Redis                        |
| Payments   | Razorpay, Stripe             |
| Deployment | Docker, Nginx, Vercel / AWS  |
| Monitoring | Prometheus, Grafana          |

---

# Installation

## Prerequisites

* Node.js 20+
* Python 3.11+ (if using FastAPI)
* PostgreSQL
* MongoDB
* Redis

## Clone Repository

```bash
git clone https://github.com/your-username/OneTapStay.git
cd OneTapStay
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Backend Setup (FastAPI Example)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

# API Example

## Create Service Request

```http
POST /api/v1/service-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomNumber": "1205",
  "serviceType": "housekeeping",
  "message": "Need extra towels"
}
```

### Response

```json
{
  "requestId": "SR-10231",
  "status": "assigned",
  "assignedTo": "Housekeeping Staff 12"
}
```

---

# User Experience Highlights

* **Check-in time reduced** from ~10 minutes to <1 minute
* **No physical key cards** required
* **Single bill** for all hotel services
* **Instant support** through in-app requests
* **Consistent recognition** across hotel properties

---

# Business Impact

| Metric                 | Expected Improvement      |
| ---------------------- | ------------------------- |
| Check-in Time          | ↓ 80–90%                  |
| Service Response Time  | ↓ 40–60%                  |
| Guest Satisfaction     | ↑ Significant             |
| Operational Efficiency | ↑ Significant             |
| Ancillary Revenue      | ↑ Through personalization |

---

# Future Roadmap

* Digital passport / Aadhaar e-KYC integration
* Voice assistant concierge
* Smart room IoT controls
* AI itinerary planner
* Facial recognition (optional, consent-based)
* Multi-language conversational assistant
* Predictive staffing and inventory analytics

---

# Team

**Tech_recons — Hack Genesis 2025**

* Product & Architecture
* Frontend Engineering
* Backend Engineering
* AI & Data Systems
* Cloud & DevOps

---

# Why OneTapStay?

OneTapStay transforms hospitality from a collection of disconnected services into a **single intelligent guest experience platform**. It combines **identity, personalization, payments, communication, and analytics** in one scalable architecture designed for modern hotels and hotel chains.

> **One identity. One tap. One seamless stay.**

---


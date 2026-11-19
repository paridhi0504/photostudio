# PhotoStudio (MERN)
Converted from the PhotoStudio frontend report (HTML/CSS/JS/LocalStorage) to React + Express + MongoDB.

## Setup
1. Install MongoDB locally or use Atlas.
2. `cd server && cp .env.example .env` (fill values) `&& npm install && npm run seed && npm run dev`
3. `cd client && cp .env.example .env && npm install && npm run dev` -> http://localhost:5173
4. Seed creates admin from ADMIN_EMAIL / ADMIN_PASSWORD plus sample services and photographers. Change the admin password.
Keys needed: Cloudinary (gallery uploads), Razorpay test keys (payments), SMTP (Gmail app password works) for email.

## Features
Auth (bcrypt + JWT, customer/admin roles) · Services/photographer/gallery CRUD · Cloudinary uploads · Gallery category filter + search ·
Booking with slot availability; double booking blocked by a partial unique MongoDB index · Razorpay order + HMAC signature verification ·
Email on registration/booking/payment/status change · Customer dashboard · Admin dashboard (stats, bookings, users, services, photographers, gallery, payments, enquiries).

## API (base /api, Bearer token auth)
| Method | Path | Access |
|---|---|---|
| POST | /auth/register, /auth/login | public |
| GET/PUT | /auth/me | user |
| GET | /services, /photographers | public |
| POST/PUT/DELETE | /services[/:id], /photographers[/:id] | admin |
| GET | /gallery?category=&q= , /gallery/categories, /gallery/:id | public |
| POST (multipart: image,title,category) / DELETE | /gallery[/:id] | admin |
| GET | /bookings/slots?photographer=&date= | public |
| POST | /bookings {service,photographer,date,slot,notes} | user (409 if slot taken) |
| GET | /bookings/mine | user |
| PATCH | /bookings/:id/cancel | user (unpaid only) |
| POST | /payments/order {bookingId} | user |
| POST | /payments/verify {bookingId,razorpay_*} | user |
| POST | /enquiries | public |
| GET/PATCH | /enquiries[/:id] | admin |
| GET | /admin/stats, /admin/users, /admin/payments, /admin/bookings | admin |
| PATCH | /admin/bookings/:id {status} | admin |
| DELETE | /admin/users/:id | admin |

## Security
helmet, CORS allow-list, rate-limited auth, NoSQL-operator stripping, bcrypt, role never accepted from client, upload type/size limits, server-side payment signature check.

PRD – Doctor & Medical Representative Management Platform

Product Name: MediFlow Connect  
Version: V1 (MVP)

1. Product Vision

We’re building MediFlow Connect to make life easier for doctors and medical representatives. The idea is pretty simple: one secure web platform for managing inventory, orders, deliveries, alerts, and professional chats—no more juggling calls, WhatsApp, spreadsheets, or bits of paper. Everything in one place, finally.

2. Target Users

Doctor

Healthcare professionals who need to:
- Request medicines or products
- Track order status
- Manage their clinic inventory
- Coordinate deliveries with M.R.s

Medical Representative (M.R.)

Reps who need to:
- Supply and manage products
- Handle stock
- Fulfill doctor requests
- Set and track delivery timelines

3. User Roles

Doctor

Can:
- Manage inventory
- Create, update, or delete orders
- Check delivery status
- Add registered M.R.s to contacts
- Chat with M.R.s
- Get stock alerts

M.R.

Can:
- Manage inventory
- Create, update, or delete orders
- Add doctors to contacts
- Update delivery schedules
- Mark deliveries as done or rejected
- Chat with doctors
- Get stock alerts

4. Authentication

Signup

Fields required:
- Full Name
- Phone Number
- Email
- Password
- Choose between Doctor or Medical Representative

Validation:
- Email and phone must be unique
- Secure password required

Login Methods:
- Email + Password

What comes later:  
- OTP verification  
- Multi-factor authentication

5. Dashboard

Layout: Bento grid style—quick overview with easy access.

Top KPIs:
- Total orders
- Pending orders
- Delivered orders
- Low stock alerts

Secondary:  
- Recent orders  
- Inventory alerts  
- Upcoming deliveries  
- Recent activity

6. Contact Management

Add contacts by phone number only.

Rules:
- Phone number must exist in the system
- Doctor can only add M.R.s, and vice versa
- Connected users show up in your contacts

7. Inventory Management

Features:
- Add, edit, delete inventory items
- Search and filter inventory

Fields:
- Item name, category, quantity, unit, min stock threshold, expiry date, notes

The system will send low stock and expiry alerts automatically.

8. Order Management

Order fields:
- Order ID, product name, quantity, priority, notes, requested delivery date/time, delivery method

Actions:
- Create, update, delete, view orders

Statuses:
- Pending, accepted, in progress, delivered, rejected

9. Delivery Management

Doctors can set:
- Preferred delivery date/time
- Delivery instructions

M.R.s can:
- Set delivery schedules
- Add expected arrival and notes
- Mark as delivered or rejected

Every update gets timestamped.

10. Chat Module (UI Ready)

For now, the chat UI and database structure will be there—real messaging, file sharing, and order-linked conversations come later.

V1:  
- Design only, backend stays off

11. Alerts & Notifications

V1 will support in-app notifications for:
- Low stock, inventory expiry, new orders, delivery updates

What’s next:  
- Push, email, and SMS notifications

12. Security Requirements

Authentication:
- JWT, password hashing, session management

Authorization:
- Role-based access, protected routes, backend validation


Audit Logging:
- Tracks every inventory, order, and delivery change

13. Database Tables

Users: id, role, full_name, phone, email, created_at  
Contacts: id, user_id, connected_user_id  
Inventory: id, owner_id, item_name, quantity, threshold, expiry_date  
Orders: id, doctor_id, mr_id, status, delivery_date, delivery_time, notes  
Notifications: id, user_id, type, message, is_read  
AuditLogs: id, user_id, action, timestamp



Dashboard style:
- Bento grid

15. MVP Scope

Build Now:
- Authentication
- Role system
- Dashboard
- Inventory management
- Order management
- Delivery tracking
- Contact linking
- Alerts
- Database + RLS

Success Criteria

A doctor or M.R. must be able to:
1. Sign up and log in
2. Connect with users of the opposite role
3. Manage inventory
4. Create and track orders
5. Monitor deliveries
6. Receive stock alerts
7. Do it all through a simple and secure dashboard
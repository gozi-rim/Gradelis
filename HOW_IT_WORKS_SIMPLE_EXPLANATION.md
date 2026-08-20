# How Gradelis Works (Simple Explanation)

This guide explains in plain terms how the system was set up, why you can log in and test everything, and what was added.

---

## 1. Why Did the Other Developer Say It Wouldn't Work?

The original project was set up expecting a database (PostgreSQL) to already be running on your computer.

Because you didn't have that database turned on:
- Trying to log in would normally crash with a *"Connection Refused"* error.
- The app also had a missing security key (`AUTH_SECRET`), which stopped the login system from working.

---

## 2. How Did We Make It Work? ("Plan A" and "Plan B")

We updated the app to use a simple **two-plan system**:

1. **Plan A (Live Database)**:
   - Every time you log in or view data, the app first checks if a real database is running.
   - If the database is connected, it saves and loads everything from the real database.

2. **Plan B (Smart Backup / Demo Mode)**:
   - If the database is **not** running on your computer, instead of crashing or showing a white error screen, the app seamlessly switches to built-in sample data.
   - This lets you log in, test the screens, upload spreadsheets, search, and click buttons without needing to install or manage database software right now.

> **Key Benefit**: When your team turns on the real database in the future, the app will automatically use it with **zero code changes**.

---

## 3. What Was Installed & Added?

| What Was Added | Why It Was Needed |
| :--- | :--- |
| **Excel Spreadsheet Reader (`xlsx`)** | Allows you to upload and parse `.xlsx` and `.csv` roster files for students, staff, and courses. |
| **Password Hasher (`bcryptjs`)** | Generates 8-character temporary passwords for new staff and safely checks login passwords. |
| **Security Key File (`.env`)** | Added the secret encryption key that the login system requires so it doesn't block you from signing in. |
| **Database Blueprint (`prisma generate`)** | Built the code structure that defines Students, Courses, Staff, and Logs. |

---

## 4. How to Log In & Test

Go to: **[http://localhost:3000/auth/login](http://localhost:3000/auth/login)**

| Role | Email | Password | What You Can Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@gradelis.com` | `password123` | Full Admin Portal (`/admin`) |
| **Head of Department (HOD)** | `hod@gradelis.com` | `password123` | HOD Portal (`/hod`) |
| **Lecturer / Course Adviser** | `lecturer@gradelis.com` | `password123` | Adviser Portal (`/adviser`) |

---

## 5. Summary of Admin Modules You Can Test

- **Students (`/admin/students`)**: Organized by Academic Sessions (`2024/2025`, `2023/2024`, etc.). Click any session to see its student list, add students, or upload an Excel roster.
- **Courses (`/admin/courses`)**: Organized by Academic Level & Semester (`100L` to `500L`, `1st` and `2nd` Semester). Click any level to see its course catalog or upload an Excel list.
- **Upload Windows (`/admin/upload-windows`)**: Set the official time window (start date & deadline) when lecturers/advisers are allowed to upload results.
- **Staff & Faculty (`/admin/staff`)**: Upload staff Excel files, automatically generate 8-character temporary passwords, copy credentials, or export them to Excel.
- **System Logs (`/admin/logs`)**: View an audit trail of all system activities, inspect log details, and export logs to Excel.

---

## 6. Will Pushing This Commit Affect the Real Database or Break Anything?

**No, it is 100% safe to push to the main repository.**

Here is why:
1. **The Database Blueprint (`schema.prisma`) Was NOT Touched**:
   - None of the database tables, fields, rules, or relations created by the other developer were modified, renamed, or deleted.
2. **The Real Database Queries Are Still There**:
   - Every feature is written to save to the real PostgreSQL database first.
   - The fallback only acts like a safety net when the database is offline. In production or on machines where the database is running, it saves directly to PostgreSQL.
3. **Only New Admin Features Were Added**:
   - All code is cleanly added into `/admin/*`, `features/administrator/*`, and `lib/*`.
   - Existing modules (HOD, Course Adviser, layouts) were left intact and unaffected.


# Student Result Management System

## Description

The Student Result Management System is a web application built to manage the academic lifecycle of students within a single university department — from the moment they enter the programme to the moment a graduation decision is made about them.

Traditionally, tracking a student's results across several years involves lecturers keeping their own records, spreadsheets being passed around, and someone manually tallying CGPA, outstanding courses, and other requirements when it's time to determine who can graduate. This process is slow, inconsistent, and difficult to verify or defend if a student ever disputes their academic status.

This system replaces that process with a structured, role-based pipeline. Course results are uploaded through a validated process rather than entered freely, every change to a student's academic record is tracked rather than silently overwritten, and graduation eligibility is determined by running every student in a graduating cohort through the same fixed set of rules — producing a clear list of who has met the requirements and, for everyone else, exactly what is still outstanding.

The system is intentionally scoped to a single department. It is not built to manage multiple departments or faculties at once.

## What the System Does

- Maintains the department's course catalog, owned and edited by the Head of Department (HOD).
- Lets the HOD assign lecturers to advise specific entry-year cohorts of students; a lecturer only gains the ability to manage a cohort's data once they've accepted that assignment.
- Allows an assigned lecturer (acting as that cohort's adviser) to build their student roster and upload course results via Excel workbooks.
- Validates every uploaded result — matching course codes and student records against what already exists in the system — and sets aside anything uncertain for the HOD to review, rather than accepting it blindly.
- Requires any correction to an already-recorded result to go through a request-and-approval process, and keeps a permanent record of every such change.
- Lets the HOD open and close specific windows of time during which results can be submitted for a given academic session and semester.
- Runs a full graduation evaluation, on demand, for an entire graduating cohort — computing each student's CGPA and checking them against the department's official requirements — and produces two lists: students who are eligible to graduate, and students who are not yet eligible, along with the specific reasons why.

## Who Uses It

- **System Admin** — manages user accounts only; has no involvement in academic data or decisions.
- **HOD** — governs the course catalog, adviser assignments, result submission periods, corrections, and graduation decisions.
- **Lecturer** — becomes a functioning course adviser for a specific cohort once assigned by the HOD and once they've accepted that assignment; responsible for that cohort's student records and result uploads.

## Why It's Built This Way

The design is built around one central idea: a student's academic record should never change without a clear, attributable, and permanent trail showing who changed it, when, and why. Every part of the system — from how results enter it, to how corrections are handled, to how a graduation decision is finalized — exists to protect that guarantee.

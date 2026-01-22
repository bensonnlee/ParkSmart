# High-Level Summary

A web application that helps students optimize their commute to campus by identifying which parking lots are closest to their classrooms and predicting parking availability. The app uses machine learning to analyze historical parking data, integrates with student class schedules, and calculates optimal departure times based on personalized preferences like arrival buffer time and transportation method.

---

# In-Depth Description

## The Problem:
Students face two major challenges when commuting to campus: (1) they don’t know which parking lots are closest to their specific classrooms, leading to unnecessary walking and late arrivals, and (2) they don’t know if lots will be full when they arrive, causing wasted time circling for spots or the stress of not knowing when to leave home. Current parking systems only show real-time availability without any spatial guidance or predictive insights, leaving students to guess both where and when to park.

## Our Solution:
Our web application solves both problems by combining intelligent routing with machine learning predictions. Users upload their class schedule (via .ics file), and the app automatically maps each classroom to its campus location. When a student selects an upcoming class, the app identifies which parking lots they’re permitted to use, ranks them by distance to that specific classroom, predicts availability based on historical patterns, and recommends the top 3 parking options along with an optimal departure time. This eliminates the guesswork of both “where should I park?” and “when should I leave?”

## Technical Approach:
The system collects parking lot occupancy data and uses time-series machine learning models to predict future availability based on time of day, day of week, and historical trends. The app maintains a database mapping classrooms to GPS coordinates and integrates with mapping APIs to calculate walking distances from each lot. Users can personalize recommendations by setting preferences like risk tolerance for being late, desired arrival buffer, and whether they walk or use alternative transport. The mobile-friendly web interface provides both live parking counts and AI-powered predictions to help students make informed decisions about both where to park and when to leave.​​​​​​​​​​​​​​​​
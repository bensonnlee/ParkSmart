# High-Level Summary

A web application that helps students plan their commute to campus by showing how long it takes to reach each parking lot and walk from there to their classroom. The app integrates with student class schedules and calculates departure times based on personalized preferences like arrival buffer time and walking speed.

---

# In-Depth Description

## The Problem:
Students don't know which parking lots are closest to their specific classrooms, leading to unnecessary walking and late arrivals. Campus parking maps show lots without any sense of what the trip actually costs: how long the drive takes, how long the walk from the lot takes, and therefore when a student needs to leave home to make it to class on time.

## Our Solution:
Our web application answers "where should I park, and when should I leave?" with travel-time math. Users upload their class schedule (via .ics file), and the app automatically maps each classroom to its campus location. When a student selects an upcoming class, the app identifies which parking lots they're permitted to use and lists them by combined driving and walking time to that specific classroom, along with the time they need to leave to arrive on schedule.

## Technical Approach:
The app maintains a database mapping classrooms and parking lots to GPS coordinates, and integrates with mapping APIs to calculate driving time from the user's location to each lot and walking time from each lot to their building. Lot-to-building walking distances are precomputed and stored; driving times are resolved from the user's current location at request time. Users can personalize the results by setting their permit type, desired arrival buffer, and walking speed, which scales the walking leg of every estimate. The mobile-friendly web interface presents the lots as a single list ordered by total travel time, each with turn-by-turn navigation to the lot.

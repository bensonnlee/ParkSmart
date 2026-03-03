import icalendar
from typing import List, Dict

""" Look in winter2026.ics for an example of the format of .ics file

Link: https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html - formatting on RRULE or recurrence rules

Link: https://stackoverflow.com/questions/3408097/parsing-files-ics-icalendar-using-python - how to begin traversing through .ics files with icalendar and specific variables/methods with icalendar

Multiple VEVENTS in one file (for every event/class, there is a VEVENT) """

#Get specific details from uploaded schedule 
def parse_ics_bytes(data: bytes) -> List[Dict]:
    """Parse raw .ics bytes and return a list of event dicts."""
    events = []
    cal = icalendar.Calendar.from_ical(data)

    for components in cal.walk():
        if components.name == "VEVENT":
            event = {}
            event["class"] = components.get("SUMMARY")
            location = components.get("LOCATION")
            if location and "Campus: Riverside Building: " in location:
                location = location.replace("Campus: Riverside Building: ", "")
            event["classroom"] = location
            event["start_time"] = components.get("DTSTART").dt
            event["end_time"] = components.get("DTEND").dt

            if components.get("RRULE"):
                if "BYDAY" in components.get("RRULE"):
                    event["days"] = components.get("RRULE")["BYDAY"]
                if "UNTIL" in components.get("RRULE"):
                    event["until"] = components.get("RRULE")["UNTIL"][0]

            events.append(event)
    return events

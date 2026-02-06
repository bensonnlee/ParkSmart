import icalendar

# User uploads their .ics file and I believe we would need some function to get the .ics file upload

""" Look in winter2026.ics for an example of the format of .ics file

Link: https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html - formatting on RRULE or recurrence rules

Link: https://stackoverflow.com/questions/3408097/parsing-files-ics-icalendar-using-python - how to begin traversing through .ics files with icalendar and specific variables/methods with icalendar

Multiple VEVENTS in one file (for every event/class, there is a VEVENT) """


def parse_ics_bytes(data: bytes) -> list[dict]:
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


def parse_ics(file_name: str) -> list[dict]:
    """Parse an .ics file by path and return a list of event dicts."""
    with open(file_name, "rb") as file:
        return parse_ics_bytes(file.read())


# Test with a sample .ics file from winter 2026 schedule
if __name__ == "__main__":
    events = parse_ics(
        "C:\\Users\\brian\\OneDrive\\Documents\\UCR\\UCR Fourth Year\\WINTER QUARTER !\\CS 179M\\ParkSmart\\backend\\app\\services\\winter2026.ics"
    )

    for i, event in enumerate(events):
        print("Classroom: " + str(event["classroom"]))
        print("Class: " + str(event["class"]))
        print("Start Time: " + str(event["start_time"]))
        print("End Time: " + str(event["end_time"]))
        print("Days: " + str(event.get("days")))
        print("Until: " + str(event.get("until")))
        print("-----------------------")

import icalendar

# User uploads their .ics file and I believe we would need some function to get the .ics file upload

""" Look in winter2026.ics for an example of the format of .ics file

Link: https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html - formatting on RRULE or recurrence rules

Link: https://stackoverflow.com/questions/3408097/parsing-files-ics-icalendar-using-python - how to begin traversing through .ics files with icalendar and specific variables/methods with icalendar

Multiple VEVENTS in one file (for every event/class, there is a VEVENT) """


def parse_ics(
    file_name: str,
) -> list[
    dict
]:  # Gets file and parses through it to extract relevant components to a dictionary and returns a list of a schedule's classes and components
    events = []

    with (
        open(file_name, "rb") as file
    ):  # Opens and reads .ics file to parse and extract relevant components; 'rb' or read binary for icalendar format
        cal = icalendar.Calendar.from_ical(file.read())

        for components in cal.walk():
            if (
                components.name == "VEVENT"
            ):  # Found a single event/class so set up a dictionary of relevant components and add to events list
                event = {}
                event["class"] = components.get("SUMMARY")
                location = components.get("LOCATION")
                if 'Campus: Riverside Building: ' in location:
                    location = location.replace('Campus: Riverside Building: ', '')
                event["classroom"] = location
                event["start_time"] = components.get(
                    "DTSTART"
                ).dt  # dt allows for better readability of datetime
                event["end_time"] = components.get("DTEND").dt

                if components.get(
                    "RRULE"
                ):  # Get which days of the week the class happens and when quarter ends
                    if "BYDAY" in components.get(
                        "RRULE"
                    ):  # Get days in component of RRULE with BYDAY key
                        event["days"] = components.get("RRULE")["BYDAY"]
                    if "UNTIL" in components.get(
                        "RRULE"
                    ):  # Get the end date of quarter with UNTIL key in RRULE
                        event["until"] = components.get("RRULE")["UNTIL"][0]

                events.append(event)
    return events


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

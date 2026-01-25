import icalendar

#User uploads their .ics file and I believe we would need some function to get the .ics file upload

""" One possible format of an .ics file:
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
UID:uid1@example.com
ORGANIZER;CN=John Doe:MAILTO:john.doe@example.com
DTSTAMP:19970701T100000Z
DTSTART:19970714T170000Z
DTEND:19970715T040000Z
SUMMARY:Bastille Day Party
GEO:48.85299;2.36885
END:VEVENT
END:VCALENDAR
Link: https://en.wikipedia.org/wiki/ICalendar - includes other components that can be included in an .ics file 

Link: https://icalendar.org/iCalendar-RFC-5545/3-3-10-recurrence-rule.html - formatting on RRULE or recurrence rules

Multiple VEVENTS in one file (for every event, there is a VEVENT) """

def parse_ics(file_name: str) -> list[dict]: #Gets file and parses through it to extract relevant components to a dictionary and returns a list of a schedule's classes and components
    events = [] 

    with open(file_name, 'rb') as file: #Opens and reads .ics file to parse and extract relevant components
        cal = icalendar.Calendar.from_ical(file.read())

        for components in cal.walk():
            if components.name == "VEVENT": #Found a single event/class so set up a dictionary of relevant components and add to events list
                event = {}
                event["class"] = components.get("SUMMARY")
                event["classroom"] = components.get("LOCATION")
                event["start_time"] = components.get("DTSTART").dt
                event["end_time"] = components.get("DTEND").dt

                if components.get("RRULE"): #Specific case to get the days from recurrence
                    if "BYDAY" in components.get("RRULE"): #BYDAY means which days of the week the event/class happens 
                        event["days"] = components.get("RRULE")["BYDAY"]
                    if "UNTIL" in components.get("RRULE"): #Get the end date of the recurrence
                        event["until"] = components.get("RRULE")["UNTIL"][0]

                events.append(event) 
    return events

#Test with a sample .ics file from winter 2026 schedule 
if __name__ == "__main__":
    events = parse_ics("winter2026.ics")

    for i, event in enumerate(events):
        print("Classroom: " + str(event["classroom"]))
        print("Class: " + str(event["class"]))
        print("Start Time: " + str(event["start_time"]))
        print("End Time: " + str(event["end_time"]))
        print("Days: " + str(event.get("days")))
        print("Until: " + str(event.get("until")))
        print("-----------------------")
        
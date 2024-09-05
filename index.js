/**
 * Calendar Merger and Uploader
 *
 * This script performs the following operations:
 * 1. Fetches events from multiple iCalendar (.ics) sources.
 * 2. Merges these events into a single calendar.
 * 3. Handles recurring events, expanding them for a one-year period.
 * 4. Adjusts event times to the specified timezone.
 * 5. Generates a new .ics file with the merged events.
 * 6. Uploads the resulting .ics file to a DigitalOcean Space and makes it publicly accessible.
 *
 * The script uses:
 * - ical-generator for creating the new calendar
 * - axios for fetching calendar data
 * - node-ical for parsing .ics files
 * - rrule for handling recurring events
 * - moment-timezone for timezone conversions
 * - @aws-sdk/client-s3 for uploading to DigitalOcean Spaces
 *
 * The resulting .ics file is named using a URL-safe version of the calendar name
 * and is made publicly accessible in the specified DigitalOcean Space.
 */

const ical = require("ical-generator").default;
const axios = require("axios");
const nodeIcal = require("node-ical");
const { RRule } = require("rrule");
const moment = require("moment-timezone");
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");

// Calendar configuration
const calendarName = "JohnDoe is EXTRAORDINARILY BUSY"; // This will be the name of the calendar in the .ics file
const calendarTimezone = "Europe/Madrid"; // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
const calendarInputUrls = [
  yepcode.env.PERSONAL_CALENDAR_URL,
  yepcode.env.WORK_CALENDAR_URL,
];

// Fetch calendar data from a given URL
async function fetchCalendar(url) {
  const response = await axios.get(url);
  return nodeIcal.async.parseICS(response.data);
}

// Adjust date to the specified timezone
function adjustDate(date, timezone) {
  return moment.tz(date, timezone).toDate();
}

// Expand recurring events within a given date range
function expandRecurringEvent(event, start, end) {
  if (!event.rrule) return [event];

  const rruleOptions = RRule.parseString(event.rrule.toString());
  rruleOptions.dtstart = moment(event.start).toDate();

  const rule = new RRule(rruleOptions);
  const dates = rule.between(start, end);

  const duration = moment(event.end).diff(moment(event.start));

  return dates.map((date) => {
    const adjustedStart = moment(date);
    return {
      ...event,
      start: adjustedStart.toDate(),
      end: adjustedStart.add(duration, "milliseconds").toDate(),
    };
  });
}

// Function to create a URL-safe string
function createUrlSafeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Main function to merge calendars
async function mergeCalendars() {
  // Fetch all calendars
  const calendarEventsArray = await Promise.all(
    calendarInputUrls.map(async (url) => fetchCalendar(url))
  );

  // Create a new calendar
  const cal = ical({ name: calendarName });

  // Set date range for events (1 year from now)
  const start = moment().tz(calendarTimezone).startOf("day").toDate();
  const end = moment()
    .tz(calendarTimezone)
    .add(1, "year")
    .endOf("day")
    .toDate();

  // Process all events from all calendars
  calendarEventsArray
    .map((events) => Object.values(events))
    .flat()
    .forEach((event) => {
      if (event.type === "VEVENT") {
        const expandedEvents = expandRecurringEvent(event, start, end);
        expandedEvents.forEach((expandedEvent) => {
          const adjustedStart = adjustDate(
            expandedEvent.start,
            event.start.tz || calendarTimezone
          );
          const adjustedEnd = adjustDate(
            expandedEvent.end,
            event.end.tz || calendarTimezone
          );

          cal.createEvent({
            start: adjustedStart,
            end: adjustedEnd,
            summary: expandedEvent.summary,
            description: expandedEvent.description,
            location: expandedEvent.location,
          });
        });
      }
    });

  return cal.toString();
}

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3({
  forcePathStyle: false,
  endpoint: yepcode.env.DIGITALOCEAN_SPACES_ENDPOINT,
  region: yepcode.env.DIGITALOCEAN_SPACES_REGION,
  credentials: {
    accessKeyId: yepcode.env.DIGITALOCEAN_SPACES_KEY,
    secretAccessKey: yepcode.env.DIGITALOCEAN_SPACES_SECRET,
  },
});

// Main execution
(async () => {
  try {
    // Merge calendars
    const mergedCalendar = await mergeCalendars();

    // Create URL-safe key from calendar name
    const urlSafeKey = `${createUrlSafeString(calendarName)}.ics`;

    // Prepare the upload command
    const putObjectCommand = new PutObjectCommand({
      Bucket: yepcode.env.DIGITALOCEAN_SPACES_BUCKET,
      Key: urlSafeKey,
      Body: mergedCalendar,
      ACL: "public-read",
      ContentType: "text/calendar",
    });

    // Upload to DigitalOcean Spaces
    const result = await s3Client.send(putObjectCommand);
    console.log("File uploaded successfully:", result);
    console.log("File key:", urlSafeKey);
  } catch (error) {
    console.error("Error in calendar merging or uploading:", error);
  }
})();

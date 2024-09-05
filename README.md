# Merge .ICS calendars in Yepcode

This project fetches events from multiple iCalendar (.ics) sources, merges them into a single calendar, and uploads the result to a DigitalOcean Space. It is designed to run on the [YepCode platform](https://yepcode.io) every 10 minutes, but can be easily adapted to run in other Node.js environments.

## Features

- Fetches events from multiple iCalendar (.ics) sources
- Merges events into a single calendar
- Handles recurring events, expanding them for a one-year period
- Adjusts event times to a specified timezone
- Generates a new .ics file with the merged events
- Uploads the resulting .ics file to a DigitalOcean Space

## Prerequisites

- A YepCode account
- YepCode CLI (optional, for downloading the project)
- A DigitalOcean account with Spaces enabled

## Setting up the project in YepCode

1. Log in to your YepCode account and create a new project.

2. In the project dashboard, create a new process.

3. Copy the contents of `index.js` from this repository and paste it into the YepCode editor.

4. Set up the following environment variables in YepCode:
   - `PERSONAL_CALENDAR_URL`: URL of your personal iCalendar
   - `WORK_CALENDAR_URL`: URL of your work iCalendar
   - `DIGITALOCEAN_SPACES_ENDPOINT`: Your DigitalOcean Spaces endpoint
   - `DIGITALOCEAN_SPACES_REGION`: Your DigitalOcean Spaces region
   - `DIGITALOCEAN_SPACES_KEY`: Your DigitalOcean Spaces access key
   - `DIGITALOCEAN_SPACES_SECRET`: Your DigitalOcean Spaces secret key
   - `DIGITALOCEAN_SPACES_BUCKET`: The name of your DigitalOcean Space bucket

5. To set up a schedule for the script to run every 10 minutes:
   - In the YepCode project dashboard, go to the "Schedules" section.
   - Create a new schedule and select your process.
   - Set the schedule to run every 10 minutes using a cron expression: `*/10 * * * *`
   - Save the schedule.

6. (Optional) To download the project using the YepCode CLI:
   - Install the YepCode CLI by following the instructions in the [YepCode documentation](https://docs.yepcode.io/cli/).
   - Log in to your YepCode account using the CLI.
   - Use the `yepcode download` command to download your project:

     ```bash
     yepcode download --project-id YOUR_PROJECT_ID --output-dir ./your-project-directory
     ```

   Replace `YOUR_PROJECT_ID` with your actual YepCode project ID and `./your-project-directory` with your desired output directory.

## Local Development (Optional)

If you want to develop or test the script locally:

1. Clone this repository:

   ```bash
   git clone https://github.com/diegomarino/merge-ics-calendars-in-yepcode.git
   cd merge-ics-calendars-in-yepcode
   ```

2. Initialize the project:

   ```bash
   npm init -y
   ```

3. Create a `variables.env` file in the root directory with the environment variables listed above.

4. Modify the `index.js` file to replace all `yepcode.env.` references with `process.env.`. You can do this manually or use a find-and-replace function in your text editor.

5. Run the script locally:

   ```bash
   node index.js
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

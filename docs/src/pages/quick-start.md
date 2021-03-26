---
id: quick-start
title: Quick Start
---

Follow the following steps to quickly monitor this Monica website and to get notification when the website is down via email using Gmail.

1. Create a `config.json` file and fill it out with the following

   ```json
   {
     "notifications": [
       {
         "id": "unique-id-smtp",
         "type": "smtp",
         "data": {
           "recipients": ["YOUR_EMAIL_ADDRESS_HERE"],
           "hostname": "smtp.gmail.com",
           "port": 587,
           "username": "YOUR_GMAIL_ACCOUNT",
           "password": "YOUR_GMAIL_PASSWORD_OR_APP_PASSWORD"
         }
       }
     ],
     "probes": [
       {
         "id": "1",
         "name": "Monika Landing Page",
         "description": "Landing page of awesome Monika",
         "interval": 10,
         "request": {
           "url": "https://hyperjumptech.github.io/monika",
           "timeout": 7000
         },
         "alerts": ["status-not-2xx"]
       }
     ]
   }
   ```

2. Replace `YOUR_EMAIL_ADDRESS_HERE` in the config.json with your email address that will receive the notification.
3. Replace `YOUR_GMAIL_ACCOUNT` with your valid Gmail account, e.g., `yourname@gmail.com`.
4. Replace `YOUR_GMAIL_PASSWORD_OR_APP_PASSWORD` with your Gmail password or if you have activated Two Factor Authentication (2FA), you need to create an app password. Check [here](https://support.google.com/accounts/answer/185833?p=InvalidSecondFactor&visit_id=637516776381460079-1520353003&rd=1) how to create an app password for your Gmail account.
5. If you have [installed Monika globally](/monika/installation), run `monika` from Terminal app (macOS) in the same directory where config.json exists. If you haven't, you can quickly run Monika by running `npx @hyperjumptech/monika` in the same directory where config.json exists.

## Configuration file

To start monitoring URLs, you'll need a configuration file (JSON file) as shown below.

> The configuration file contains the [probes](/monika/guides/probes), [alerts](/monika/guides/alerts), and [notification](/monika/guides/notifications) configurations.

```
// config.json

{
  "notifications": [
    {
      "id": "unique-id-mailgun",
      "type": "mailgun",
      "data": {
        "recipients": ["RECIPIENT_EMAIL_ADDRESS"],
        "apiKey": "YOUR_API_KEY",
        "domain": "YOUR_DOMAIN"
      }
    },
    {
      "id": "unique-id-sendgrid",
      "type": "sendgrid",
      "data": {
        "recipients": ["RECIPIENT_EMAIL_ADDRESS"],
        "apiKey": "YOUR_API_KEY"
      }
    },
    {
      "id": "unique-id-smtp",
      "type": "smtp",
      "data": {
        "recipients": ["RECIPIENT_EMAIL_ADDRESS"],
        "hostname": "SMTP_HOSTNAME",
        "port": SMTP_PORT,
        "username": "SMTP_USERNAME",
        "password": "SMTP_PASSWORD"
      }
    },
    {
      "id": "unique-id-webhook",
      "type": "webhook",
      "data": {
        "method": "POST",
        "url": "https://examplewebhookurl.com/webhook"
      }
    }
  ],
  "probes": [
    {
      "id": "1",
      "name": "Example",
      "description": "Probe",
      "interval": 0,
      "request": {
        "method": "POST",
        "url": "https://something/login",
        "timeout": 7000,
        "headers": {
          "Authorization": ""
        },
        "body": {
          "username": "someusername",
          "password": "somepassword"
        }
      },
      "alerts": ["status-not-2xx", "response-time-greater-than-200-ms"]
    }
  ]
}
```

Monika by default reads a configuration file called `config.json` in the current working directory if it exists. You can specify a path to a JSON configuration file with `-c` flag as follows

```bash
monika -c <path_to_configuration_json_file>
```

Or if you haven't installed Monika globally, you can run it without installing first using [npx](https://www.npmjs.com/package/npx):

```bash
npx @hyperjumptech/monika -c <path_to_configuration_json_file>
```

## Background run

By default Monika will run in the foreground. Like other Node.js applications, there are several ways to run Monika in the background on Unix, Linux, and macOS.

### Using `nohup`

- On your terminal, run `nohup monika &`
- You'll get an output similar to the following.

  ```
  [1] 93457
  appending output to nohup.out
  ```

  In the above example, 93457 is the process ID (pid). And the output of Monika is written to `nohup.out` file.

- To stop Monika, run `kill -9 <pid>`.

### Using `screen`

- Run `screen`. If you haven't installed it yet, you need to install it first. On Linux, please run `sudo apt install screen`.
- Run `monika -c config.json`
- Press Ctrl+a then D. This will cause Monika to run on a different screen in the background.
- To go back to the screen, run `screen -ls` to list the running screens. You will get an output similar to the following.

  ```
  There is a screen on:
    9049.pts-0.the-server	(03/23/21 08:34:38)	(Detached)
    1 Socket in /run/screen/S-server.
  ```

  `9049.pts-0.the-server` is the name of the screen.

- Then run `screen -r <name_of_the_screen>`.
- To stop Monika, hit Ctrl+c then Ctrl+d.
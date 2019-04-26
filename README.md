## Healthcare video prototype

A healthcare video prototype using Twilio

### Prerequisites

* node.js
* mongodb
* openSSL

### Installing

Install dependencies:

```
npm install
```


Start mongodb:

```
mongod
```

Enter Twilio API credentials:

```
Copy .env_template and name it .env
```

```
Enter your Twilio API credentials in .env file (get them at Twilios website)
```

To enable HTTPS/SSL, generate key.pem and certificate.pem and put them in cert folder (openSSL is required):

```
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem
```

### Run app

To insert test data into mongo, run:

```
NODE_ENV=testData node app.js
```

Run app:

```
node app.js
```

Run app in browser:

```
https://localhost:3000
```

### Notes

Login credentials:
* Doctor IDs: 1-4
* Patient IDs: 5-8

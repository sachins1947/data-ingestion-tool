﻿# assignment-
ClickHouse & Flat File Ingestion Tool

A web application to upload CSV files to ClickHouse and download data as CSV, built with a Spring Boot backend and React frontend.

Overview

This project allows users to:

Connect to a ClickHouse database.

Upload CSV files to a ClickHouse table (e.g., test_table).

Preview table data in the UI.

Download table data as CSV.

Before running the application, you need to set up ClickHouse, create a table, and prepare a test CSV file. This README guides you through each step, explaining why they're necessary.

Prerequisites

To run this project, ensure you have:

Docker and Docker Compose installed (Install Docker Desktop for Windows).

Java 17 for the backend (e.g., OpenJDK, download from adoptium.net).

Node.js 18 for the frontend (download from nodejs.org).

Windows Command Prompt (cmd) or PowerShell for running commands.

A text editor (e.g., Notepad) for creating config files.

Why these tools?

Docker runs ClickHouse, the database we use for storing CSV data.

Java runs the Spring Boot backend, which handles API calls to ClickHouse.

Node.js runs the React frontend, which provides the UI for uploading/downloading CSVs.

Setup

Before starting the backend and frontend, you need to configure ClickHouse and prepare test data. Follow these steps in order.

1. ClickHouse Docker Setup

We need to run ClickHouse in a Docker container to store and query data.

docker pull clickhouse/clickhouse-server
docker run -d -p 8123:8123 -p 9000:9000 --name clickhouse-server clickhouse/clickhouse-server

What it does: Pulls the latest ClickHouse image and starts a container named clickhouse-server, exposing port 8123 (HTTP API) and 9000 (TCP client).

Why: The application connects to ClickHouse to store CSV data, so it must be running.

Verify:

curl http://localhost:8123

Expected: Ok

2. Reset Default User Password

ClickHouse's default user has no password initially. For development, we'll set a blank password and allow access from any IP (not secure for production!).

Stop ClickHouse Container

docker stop clickhouse-server

Why: We need to stop the container to apply a custom configuration.

Create Custom Config

Create a folder for the configuration:

mkdir clickhouse-config
cd clickhouse-config

Create a file users.xml using Notepad or any text editor:

<?xml version="1.0"?>
<yandex>
    <users>
        <default>
            <password></password>
            <networks>
                <ip>::/0</ip>
            </networks>
            <profile>default</profile>
            <quota>default</quota>
        </default>
    </users>
</yandex>

What it does: Configures the default user with a blank password and allows connections from any IP.

Why: The application uses the default user to connect to ClickHouse, and a blank password simplifies development setup.

How to create:

echo ^<?xml version="1.0"?^> > users.xml
echo ^<yandex^> >> users.xml
echo ^<users^> >> users.xml
echo ^<default^> >> users.xml
echo ^<password^>^</password^> >> users.xml
echo ^<networks^> >> users.xml
echo ^<ip^>::/0^</ip^> >> users.xml
echo ^</networks^> >> users.xml
echo ^<profile^>default^</profile^> >> users.xml
echo ^<quota^>default^</quota^> >> users.xml
echo ^</default^> >> users.xml
echo ^</users^> >> users.xml
echo ^</yandex^> >> users.xml

Run ClickHouse with Mounted Config

Delete the existing container (data persists in Docker volumes):

docker rm clickhouse-server

Start a new container with the custom config:

docker run -d -p 8123:8123 -p 9000:9000 --name clickhouse-server -v %CD%/clickhouse-config:/etc/clickhouse-server/users.d clickhouse/clickhouse-server

What it does: Mounts the clickhouse-config folder to the container's config directory, applying users.xml.

Why: Ensures ClickHouse uses our custom user settings for authentication.

Note: %CD% refers to the current directory (Windows-specific).

Verify

docker exec -it clickhouse-server clickhouse-client --query="SELECT 1;"

Expected: 1

Why: Confirms ClickHouse is running and accessible with the default user.

3. Create test_table

Create a table in ClickHouse to store CSV data.

docker exec -it clickhouse-server clickhouse-client --query="CREATE TABLE test_table (col1 String, col2 String) ENGINE = MergeTree() ORDER BY col1;"

What it does: Creates a table named test_table with two columns: col1 (String) and col2 (String), using the MergeTree engine for persistent storage.

Why: The application expects test_table to upload and query CSV data.

Verify:

docker exec -it clickhouse-server clickhouse-client --query="SELECT \* FROM test_table;"

Expected: Empty table (no rows yet).

4. Create a Test CSV

Create a sample CSV file to test uploading via the UI.

mkdir C:\test
echo col1,col2 > C:\test\input.csv
echo value1,value2 >> C:\test\input.csv
echo value3,value4 >> C:\test\input.csv

What it does: Creates a file C:\test\input.csv with the following content:

col1,col2
value1,value2
value3,value4

Why: The UI needs a CSV file to test the upload functionality, and this file matches test_table's schema.

Verify:

type C:\test\input.csv

Expected:

col1,col2
value1,value2
value3,value4

Run Application

Now that ClickHouse and test data are set up, start the backend and frontend.

1. Run Backend

The backend handles API requests to connect to ClickHouse, upload CSVs, and query data.

cd backend
mvn clean install
mvn spring-boot:run

What it does: Builds and runs the Spring Boot application on http://localhost:8080.

Why: The frontend sends API requests (e.g., /api/ingest/ff-to-ch-upload) to the backend, so it must be running.

Verify:

curl http://localhost:8080/api/tables

Expected: {"tables":["test_table"]}

2. Run Frontend

The frontend provides the UI for interacting with ClickHouse.

cd frontend
npm install
npm run dev

What it does: Installs dependencies and runs the React application on http://localhost:5173.

Why: Users interact with the application through the browser-based UI.

Verify: Open http://localhost:5173 in a browser. You should see the Connect form.

Usage

Connect to ClickHouse:

Open http://localhost:5173.

In the Connect form:

Host: localhost

Port: 8123

User: default

Password: (leave blank)

Click "Connect".

Expected: "Connected" status.

Upload CSV:

Go to the Ingestion form.

Select test_table.

Check columns col1 and col2.

Choose C:\test\input.csv.

Click "Upload to ClickHouse".

Expected: "Upload complete: 2 records".

Preview table:

| col1   | col2   |
| ------ | ------ |
| value1 | value2 |
| value3 | value4 |

Download CSV:

Select test_table and columns col1, col2.

Click "Download from ClickHouse".

Check C:\test\output.csv for downloaded data.

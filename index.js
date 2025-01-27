import express from "express";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import path from "path";
import attendeesRoutes from "./routes/attendees.js";
import { fileURLToPath } from "url";
import session from "express-session";
import organizersRoutes from "./routes/organizers.js";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // set the app to use ejs for rendering
app.use(express.static(__dirname + "/public")); // set location of static files
app.use(
  session({
    secret: "mn6K9#pL2$vX8zQ4a34)f",
    saveUninitialized: true,
    resave: true,
    cookie: {
      maxAge: 60000 * 60 * 24, // store the session for a day,
    },
  })
);
//Main usage is to allow logged in organiser to log out and switch account if needed
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
// const sqlite3 = require("sqlite3").verbose();
global.db = new sqlite3.Database("./database.db", function (err) {
  if (err) {
    console.error(err);
    process.exit(1); // bail out we can't connect to the DB
  } else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
  }
});

// Handle requests to the home page
app.get("/", (req, res) => {
  req.session.visited = true;
  res.render("home");
});

// Add all the route handlers in usersRoutes to the app under the path /users
app.use("/attendees", attendeesRoutes);
app.use("/organizers", organizersRoutes);
// Make the web application listen for HTTP requests
app.listen(port, () => {
  console.log(`Event manager app ${port}`);
});

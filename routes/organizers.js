
import express from "express";
const organizersRoutes = express.Router();
import { validateEvent, validateUser, validateSiteSettings } from "../middleware/validator.js";
import { isAuthenticated } from "../middleware/auth.js";

import { hash, genSalt, compare } from "bcrypt";
import session from "express-session";

//Display login page
organizersRoutes.get("/login", (req, res, next) => {
  const errorMessage = req.session.loginError;
  req.session.loginError = null;

  res.render("organizers/login", { errorMessage });
});

//Authenticate the user
organizersRoutes.post("/login", (req, res, next) => {
  // code to autenticate the user
  const { username, password } = req.body;
  // check if the user is in the database
  const query = `SELECT * FROM organizers WHERE username = ?`;
  global.db.get(query, [username], async (err, row) => {
    if (err) {
      return res.render("errorPage", {
        status: 500,
        message: "An error occurred when trying to log in.",
      });
    }
    if (!row) {
      ("Invalid username");
      return res.render("organizers/login", { errorMessage: "Invalid username." });
    }
    const passwordMatch = await compare(password, row.password_hash);
    if (!passwordMatch) {
      return res.render("organizers/login", { errorMessage: "Invalid password." });
    }
    req.session.isLoggedIn = true;
    req.session.userRole = "organizer";
    req.session.organizerId = row.id;
    return res.redirect("/organizers/home");
  });
});

//Log out the user
organizersRoutes.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/organizers/login");
});

// New organizer sign up page
organizersRoutes.get("/sign-up", (req, res, next) => {
  res.render("organizers/sign-up", { errorMessage: null });
});

//Actually create new organizer and register to db
organizersRoutes.post("/sign-up", validateUser(), async (req, res, next) => {
  const { username, password, email } = req.body;
  const hashedPassword = await hash(password, await genSalt());

  //create and sing up new organizer first
  const organizerQuery = `
    INSERT INTO organizers (username, password_hash, email)
    VALUES (?, ?, ?)
  `;

  global.db.run(organizerQuery, [username, hashedPassword, email], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        const existingField = err.message.split("organizers.")[1];
        return res.render("organizers/sign-up", {
          errorMessage: `${existingField} already exists.`,
        });
      }
      return res.render("organizers/sign-up", { errorMessage: err.message });
    }

    const organizerId = this.lastID;
    //and immediately after create site settings (initially default, then the organizer can change them later)
    // bound to that organizer
    const settingsQuery = `
      INSERT INTO site_settings (site_name, site_description, organizer_id)
      VALUES ('Event Manager', 'A web site to manage events and bookings', ?)
    `;

    global.db.run(settingsQuery, [organizerId], (err) => {
      // Use stored organizerId
      if (err) {
        return res.render("organizers/sign-up", { errorMessage: err.message });
      }
      res.redirect("/organizers/login");
    });
  });
});
// for all organizer routes below authentication is required
organizersRoutes.use(isAuthenticated);

//Display organizer home page
organizersRoutes.get("/home", (req, res, next) => {
  const settingsQuery = `SELECT site_name, site_description FROM site_settings WHERE organizer_id=?`;
  global.db.get(settingsQuery, [req.session.organizerId], (settingsErr, settings) => {
    if (settingsErr) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when fetching website settings.",
      });
    }

    // Query events
    const eventsQuery = `SELECT * FROM events WHERE organizer_id = ? ORDER BY created_at DESC`;
    global.db.all(eventsQuery, [req.session.organizerId], (eventsErr, allEvents) => {
      if (eventsErr) {
        return res.status(500).render("errorPage", {
          status: 500,
          message: "An error occurred when fetching events.",
        });
      }

      // Separate published and draft events
      const publishedEvents = allEvents.filter((e) => e.status === "published");
      const draftEvents = allEvents.filter((e) => e.status === "draft");

      // Render the home page
      "settings", settings;
      return res.render("organizers/home", {
        siteName: settings?.site_name || "Provide a Site Name",
        siteDescription: settings?.site_description || "Provide a Site Name",
        publishedEvents,
        draftEvents,
      });
    });
  });
});

// Display the create event page
organizersRoutes.get("/event/:id/edit", (req, res) => {
  const query = `SELECT * FROM events WHERE id=?`;
  const eventId = req.params.id;
  global.db.get(query, [eventId], (err, eventRow) => {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when fetching event.",
      });
    }
    if (!eventRow) {
      return res.status(404).render("errorPage", {
        status: 404,
        message: "Event not found.",
      });
    }
    return res.render("organizers/event-edit", { event: eventRow, errorMessage: null });
  });
});

// Displaye event details as organizer, with extra booking details and insights
organizersRoutes.get("/event/:id", (req, res) => {
  const eventQuery = `
    SELECT * FROM events 
    WHERE id = ? AND organizer_id = ?
  `;

  const bookingsQuery = `
    SELECT 
      a.name, 
      a.email,
      b.full_tickets_count,
      b.concession_tickets_count,
      b.total_amount
    FROM bookings b
    JOIN attendees a ON b.attendee_id = a.id
    WHERE b.event_id = ?
  `;

  global.db.get(eventQuery, [req.params.id, req.session.organizerId], (err, event) => {
    req.session, "req.session";
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when fetching event details. Please try again later",
      });
    }
    if (!event)
      return res.status(404).render("errorPage", {
        status: 404,
        message: "Event not found.",
      });

    global.db.all(bookingsQuery, [req.params.id], (err, bookings) => {
      if (err) {
        return res.status(500).render("errorPage", {
          status: 500,
          message:
            "An error occurred when fetching event bookings details. Please try again later.",
        });
      }

      res.render("organizers/event-view", { event, bookings });
    });
  });
});

//Create initial draft of event with minimal/default values to avoid users adding invalid event to db if they leave the page during creation
// event validation is carried out when the event is updated with the actual details, enforcing the valdity of event before ready for publishing
organizersRoutes.post("/create-event", (req, res) => {
  const organizerId = req.session.organizerId;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const fmtCreationDate = new Date().toISOString().split("T")[0];
  const query = `
    INSERT INTO events (
      title, 
      status,
      event_date, 
      created_at,
      organizer_id,
      full_price_ticket_count,
      concession_ticket_count
    ) VALUES (
      'New Draft Event', 
      'draft', 
      ?, 
      ?, 
      ?,
      1,  
      0
    )
  `;

  global.db.run(query, [defaultDate, fmtCreationDate, organizerId], function (err) {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "Something went wrong when creating the event. Please try again later",
      });
    }
    const newId = this.lastID; // the newly inserted event's id
    "New event ID:", newId;

    // Redirect to edit page
    return res.redirect(`/organizers/event/${newId}/edit`);
  });
});

// Update event details after intial draft has been created with events/create-event, this is where actual event validation is done
organizersRoutes.post("/event/:id/edit", validateEvent(), (req, res) => {
  const eventId = req.params.id;
  const {
    title,
    description,
    date,
    fullPriceCount,
    fullPriceCost,
    concessionCount,
    concessionCost,
  } = req.body;

  const organizerId = req.session.organizerId;
  const query = `
    UPDATE events 
  SET 
    title=?,
    description=?,
    event_date=?,
    full_price_ticket_count=?,
    full_price_ticket_cost=?,
    concession_ticket_count=?,
    concession_ticket_cost=?,
    organizer_id=?
  WHERE id=?
  `;
  global.db.run(
    query,
    [
      title,
      description,
      date,
      fullPriceCount || 0,
      fullPriceCost || 0,
      concessionCount || 0,
      concessionCost || 0,
      organizerId,
      eventId,
    ],
    (err) => {
      if (err) {
        return res.status(500).render("errorPage", {
          status: 500,
          message: "An error occurred when updating the event.",
        });
      }
      return res.redirect("/organizers/home");
    }
  );
});

// Critical action of publishing the event, this is where the event is made public and available for booking, validation is done before this so that only valid events can get to the published state
organizersRoutes.post("/publish-event/:id", (req, res) => {
  const eventId = req.params.id;
  req.body, "req.body inside publish-event/:id";
  const fmtPublishDate = new Date().toISOString().split("T")[0];
  const query = `
    UPDATE events 
    SET status='published', published_at=?, organizer_id=?
    WHERE id=?
  `;
  global.db.run(query, [fmtPublishDate, req.session.organizerId, eventId], (err) => {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "Something went wrong when creating the event. Please try again later",
      });
    }
    return res.redirect("/organizers/home");
  });
});

// Delete event, this is a critical action and should be done with caution, all bookings related to the event are also deleted to avoid foreign key constraint error
organizersRoutes.post("/delete-event/:id", (req, res) => {
  const eventId = req.params.id;
  const deleteBookingsQuery = `DELETE FROM bookings WHERE event_id=?`;
  //Delete bookings connected to the event to avoid foreign key constraint error
  global.db.run(deleteBookingsQuery, [eventId], (err) => {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "We couldn't delete the event bookings. Please try again later",
      });
    }

    const deleteEventQuery = `DELETE FROM events WHERE id=?`;
    global.db.run(deleteEventQuery, [eventId], (err) => {
      if (err) {
        return res.status(500).render("errorPage", {
          status: 500,
          message: "We couldn't delete your event. Please try again later",
        });
      }
      return res.redirect("/organizers/home");
    });
  });
});

// Display the site settings page
organizersRoutes.get("/site-settings", (req, res) => {
  const query = `SELECT site_name, site_description FROM site_settings WHERE organizer_id=?`;
  global.db.get(query, [req.session.organizerId], (err, row) => {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred trying to access website settings.",
      });
    }
    if (!row) {
      return res.status(404).render("errorPage", {
        status: 404,
        message: "Website settings not found.",
      });
    }
    return res.render("organizers/site-settings", {
      siteName: row?.site_name || "",
      siteDescription: row?.site_description || "",
      errorMessage: null,
    });
  });
});

// Update site settings as organizer
organizersRoutes.post("/site-settings", validateSiteSettings(session), (req, res) => {
  const { siteName, siteDescription } = req.body;
  if (!siteName || !siteDescription) {
    return res.render("organizers/site-settings", {
      siteName,
      siteDescription,
      errorMessage: "All fields are required!",
    });
  }
  const query = `UPDATE site_settings SET site_name=?, site_description=? WHERE id=?`;
  global.db.run(query, [siteName, siteDescription, req.session.organizerId], function (err) {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred updating website settings.",
      });
    }
    return res.redirect("/organizers/home");
  });
});

export default organizersRoutes;

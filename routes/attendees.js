import express from "express";
import { validateBooking } from "../middleware/validator.js";
const attendeesRoutes = express.Router();

// Display all events that can be booked
attendeesRoutes.get("/home", (req, res, next) => {
  const settingsQuery = `SELECT site_name, site_description FROM site_settings WHERE id=1`;
  global.db.get(settingsQuery, (settingsErr, settings) => {
    if (settingsErr) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when fetching website settings.",
      });
    }

    const eventsQuery = `SELECT * FROM events WHERE status = 'published' ORDER BY event_date DESC`;
    global.db.all(eventsQuery, (eventsErr, allEvents) => {
      if (eventsErr) {
        return res.status(500).render("errorPage", {
          status: 500,
          message: "An error occurred when fetching events.",
        });
      }
      return res.render("attendees/home", {
        siteName: settings?.site_name || "Event Manager",
        siteDescription:
          settings?.site_description || "Event Manager, the best place to find events",
        events: allEvents,
      });
    });
  });
});

// Display event details and booking form
attendeesRoutes.get("/event/:id", (req, res, next) => {
  const query = "SELECT * FROM events WHERE id = ?";

  global.db.get(query, [req.params.id], (err, event) => {
    if (err) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when fetching event details.",
      });
    }
    if (!event)
      return res.status(404).render("errorPage", {
        status: 404,
        message: "Event not found.",
      });

    res.render("attendees/event", { event, errorMessage: null });
  });
});

// Book an event and register attendee
attendeesRoutes.post("/book-event/:id", validateBooking(), (req, res, next) => {
  const eventId = req.params.id;
  const { attendeeName, attendeeEmail, fullPriceTickets, concessionTickets } = req.body;

  // First check if enough tickets are available, this action is also enfornce on the front-end but it's good to have it here as well
  const checkQuery = `
    SELECT full_price_ticket_count, concession_ticket_count,
           full_price_ticket_cost, concession_ticket_cost
    FROM events 
    WHERE id = ? AND status = 'published'
  `;

  global.db.get(checkQuery, [eventId], (checkQueryErr, event) => {
    if (checkQueryErr) {
      return res.status(500).render("errorPage", {
        status: 500,
        message: "An error occurred when trying to book an event.",
      });
    }
    if (!event)
      return res.status(404).render("errorPage", {
        status: 404,
        message: "Event not found.",
      });

    // Validate ticket availablity parsing input as integer as all input is coming as string, this is to avoid 0 > '' evaluating to true
    if (
      parseInt(fullPriceTickets) > parseInt(event.full_price_ticket_count) ||
      parseInt(concessionTickets) > parseInt(event.concession_ticket_count) ||
      isNaN(parseInt(event.concession_ticket_count))
    ) {
      return res.render("attendees/event", {
        event,
        errorMessage: ["Not enough tickets available"], //Enforced on the front-end as well
      });
    }

    const totalAmount =
      fullPriceTickets * event.full_price_ticket_cost +
      concessionTickets * event.concession_ticket_cost;

    // register attendee
    const attendeeQuery = "INSERT INTO attendees (name, email) VALUES (?, ?)";
    global.db.run(attendeeQuery, [attendeeName, attendeeEmail], function (insertAttendeeErr) {
      if (insertAttendeeErr) {
        return res
          .status(500)
          .render("errorPage", { status: 500, message: "An error occurred when booking event." });
      }

      const attendeeId = this.lastID;

      // Create booking
      const bookingQuery = `
        INSERT INTO bookings 
        (event_id, attendee_id, full_tickets_count, concession_tickets_count, total_amount) 
        VALUES (?, ?, ?, ?, ?)
      `;

      global.db.run(
        bookingQuery,
        [eventId, attendeeId, fullPriceTickets, concessionTickets, totalAmount],
        (bookingErr) => {
          if (bookingErr) {
            return res.status(500).render("errorPage", {
              status: 500,
              message: "An error occurred when booking event.",
            });
          }

          // Update event detils to reflect the booking
          const updateQuery = `
            UPDATE events 
            SET full_price_ticket_count = full_price_ticket_count - ?,
                concession_ticket_count = concession_ticket_count - ?
            WHERE id = ?
          `;

          global.db.run(
            updateQuery,
            [fullPriceTickets, concessionTickets, eventId],
            (updateBookingErr) => {
              if (updateBookingErr) {
                return res.status(500).render("errorPage", {
                  status: 500,
                  message: "An error occurred when updating booking details.",
                });
              }
              res.redirect("/attendees/home");
            }
          );
        }
      );
    });
  });
});

export default attendeesRoutes;

import { body, validationResult } from "express-validator";
const validate = (validations, view) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    //remove password from old input (as it is exposed via session)
    const sanitizedInput = { ...req.body };
    delete sanitizedInput.password;
    req.session.oldInput = sanitizedInput;
    if (errors.isEmpty()) {
      delete req.session.oldInput;
      return next();
    }
    const errorStrings = errors.array().map((error) => error.msg);
    // the check is for routes that require an id (event routes mostly), in that case the event needs to be fetched from db to be re-sent to the view
    if (req.params.id) {
      global.db.get("SELECT * FROM events WHERE id = ?", [req.params.id], (err, event) => {
        if (err) {
          return res.status(500).send("Database error");
        }

        const viewParams = {
          errorMessage: errorStrings,
          event: {
            ...event,
            ...req.session.oldInput,
          },
        };
        res.render(view, viewParams);
      });
    } else {
      //eventless views only require errorMessage if any
      res.render(view, {
        errorMessage: errorStrings,
        ...req.session.oldInput,
      });
    }
  };
};

export function validateUser() {
  return validate(
    [
      body("username")
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters")
        .notEmpty()
        .withMessage("User name can't be empty") // fallback -> required attribute in html could be easily removed with page inspector,
        .matches(/^[a-zA-Z0-9._]*$/)
        .withMessage("Username can only include letters, numbers, underscores and periods"),
      body("email")
        .isEmail()
        .withMessage("Email must be a valid email address")
        .notEmpty()
        .withMessage("Email can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
      body("password")
        .isLength({ min: 8, max: 20 })
        .withMessage("Password must be at least 8 characters long and at most 20 characters long")
        .matches(/^(?=.*[a-zA-Z0-9])(?=.*[.,'!&]).*$/)
        .withMessage(
          "Password should be alphanumeric and contain at least one of these special characters: .,'!&"
        )
        .notEmpty()
        .withMessage("Password can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector
    ],
    "organizers/sign-up"
  );
}

export function validateEvent() {
  // I am explicitly chosing not to validate 0 price for tickets, in case of free-entry events
  return validate(
    [
      body("title")
        .isLength({ min: 8 })
        .withMessage("Event name must be at least 8 characters")
        .notEmpty()
        .withMessage("Event name can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
      body("date")
        .isDate()
        .withMessage("Date must be a valid date")
        .notEmpty()
        .withMessage("Date can't be empty")
        .custom(dateNotBeforeTomorrow)
        .withMessage("You can only plan an event starting from tomorrow"), // fallback -> required attribute in html could be easily removed with page inspector,
      body("fullPriceCount")
        .isNumeric()
        .withMessage("Full price tickets count must be a number")
        .custom((value, { req }) => {
          const fullPrice = parseInt(value) || 0;
          const concession = parseInt(req.body.concessionCount) || 0;
          if (fullPrice + concession === 0) {
            throw new Error("Total number of tickets must be greater than 0");
          }
          return true;
        }),
    ],
    "organizers/event-edit"
  );
}

export function validateSiteSettings() {
  return validate(
    [
      body("siteName")
        .isLength({ min: 5 })
        .withMessage("Site name must be at least 5 characters")
        .notEmpty()
        .withMessage("Site name can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
      body("siteDescription")
        .isLength({ min: 10 })
        .withMessage("Site description must be at least 10 characters")
        .notEmpty()
        .withMessage("Site description can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
    ],
    "organizers/site-settings"
  );
}

export function validateBooking() {
  return validate(
    [
      body("attendeeName")
        .isLength({ min: 2 })
        .withMessage("Attendee name must be at least 2 characters") // to be fully inclusive some asian and arabic names are shorter
        .notEmpty()
        .withMessage("Attendee name can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
      body("attendeeEmail")
        .isEmail()
        .withMessage("Attendee email must be a valid email address")
        .notEmpty()
        .withMessage("Attendee email can't be empty"), // fallback -> required attribute in html could be easily removed with page inspector,
      body().custom((value) => {
        const fullPrice = parseInt(value.fullPriceTickets) || 0;
        const concession = parseInt(value.concessionTickets) || 0;
        if (fullPrice + concession === 0) {
          throw new Error("You must book at least one ticket!");
        }
        return true;
      }),
    ],
    "attendees/event"
  );
}

//helper to avoid that the event date is set to today or the past, express-validator does not support this by default
function dateNotBeforeTomorrow(value) {
  const inputDate = new Date(value);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(0, 0, 0, 0);

  if (inputDate < tomorrow) {
    throw new Error("Event date must be at least tomorrow.");
  }
  return true;
}

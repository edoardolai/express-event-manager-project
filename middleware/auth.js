// This file contains the middleware functions that are used to check if the user is authenticated or not
export function isAuthenticated(req, res, next) {
  if (req.session && req.session.userRole === "organizer" && req.session.isLoggedIn) {
    return next();
  } else {
    res.redirect("/organizers/login");
  }
}

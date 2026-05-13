/**
 * POST /api/users/logout
 *
 * Clears the HttpOnly token cookie that was set at login.
 * The cookie options (httpOnly, secure, sameSite) must match the
 * options used when the cookie was originally set so the browser
 * accepts the clear directive.
 */
const userLogout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = userLogout;

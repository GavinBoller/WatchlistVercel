"use strict";
/**
 * Emergency login page system for extreme fallback
 * This provides a completely independent authentication mechanism
 * that doesn't rely on any database or complex logic
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyLoginRouter = void 0;
var express_1 = require("express");
var jsonwebtoken_1 = require("jsonwebtoken");
var jwtAuth_1 = require("./jwtAuth");
var router = express_1.default.Router();
// Generate a very simple token for emergency purposes
function generateSimpleToken(username) {
    var user = {
        id: -1, // Use a negative ID to indicate this is an emergency login
        username: username,
        displayName: username,
        emergency: true
    };
    return jsonwebtoken_1.default.sign(user, jwtAuth_1.JWT_SECRET, { expiresIn: '24h' });
}
// Serve a simple emergency login page
router.get('/emergency-login', function (req, res) {
    var html = "\n    <!DOCTYPE html>\n    <html>\n    <head>\n      <title>Emergency Login</title>\n      <style>\n        body {\n          font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n          padding: 40px;\n          max-width: 600px;\n          margin: 0 auto;\n          text-align: center;\n        }\n        h1 {\n          color: #e11d48;\n        }\n        p {\n          line-height: 1.5;\n          margin-bottom: 20px;\n        }\n        input {\n          padding: 10px;\n          width: 100%;\n          box-sizing: border-box;\n          margin-bottom: 15px;\n          border: 1px solid #ccc;\n          border-radius: 4px;\n          font-size: 16px;\n        }\n        button, .button {\n          background: #e11d48;\n          border: none;\n          color: white;\n          padding: 10px 20px;\n          border-radius: 4px;\n          cursor: pointer;\n          font-size: 16px;\n          width: 100%;\n          display: block;\n          text-align: center;\n          text-decoration: none;\n          margin-bottom: 10px;\n        }\n        button:hover, .button:hover {\n          background: #9f1239;\n        }\n        .note {\n          font-size: 14px;\n          color: #666;\n          margin-top: 30px;\n        }\n        .super-emergency {\n          margin-top: 30px;\n          padding: 15px;\n          border: 1px dashed #ccc;\n          border-radius: 4px;\n        }\n        h2 {\n          font-size: 18px;\n          margin-bottom: 15px;\n        }\n      </style>\n    </head>\n    <body>\n      <h1>Emergency Login</h1>\n      <p>This page provides a special login mechanism when normal authentication fails.</p>\n      \n      <div>\n        <label for=\"username\">Username:</label>\n        <input type=\"text\" id=\"username\" placeholder=\"Enter your username\">\n        <button onclick=\"login()\">Emergency Login</button>\n      </div>\n      \n      <div class=\"super-emergency\">\n        <h2>Quick Access Emergency Links</h2>\n        <p>Use these pre-configured links for immediate login:</p>\n        <a href=\"#\" class=\"button\" onclick=\"loginWithPreset('Gavin100')\">Login as Gavin100</a>\n        <a href=\"#\" class=\"button\" onclick=\"loginWithPreset('Gaju101')\">Login as Gaju101</a>\n        <a href=\"#\" class=\"button\" onclick=\"loginWithDirectToken('Gavin100')\">Super Emergency Login (Gavin100)</a>\n      </div>\n      \n      <p class=\"note\">Note: This is a fallback mechanism and should only be used when regular login fails.</p>\n      \n      <script>\n        function login() {\n          const username = document.getElementById('username').value;\n          if (!username) {\n            alert('Please enter a username');\n            return;\n          }\n          \n          // Redirect to the app with emergency parameters\n          window.location.href = '/?emergencyLogin=true&user=' + encodeURIComponent(username) + '&directAuth=true';\n        }\n        \n        function loginWithPreset(username) {\n          window.location.href = '/?emergencyLogin=true&user=' + encodeURIComponent(username) + '&directAuth=true';\n        }\n        \n        function loginWithDirectToken(username) {\n          // Get direct token and use it for authentication\n          fetch('/api/emergency/raw-token/' + username)\n            .then(response => response.json())\n            .then(data => {\n              if (data.token) {\n                // Store token locally\n                localStorage.setItem('jwt_token', data.token);\n                sessionStorage.setItem('jwt_token', data.token);\n                \n                // Set emergency data\n                sessionStorage.setItem('emergency_user', username);\n                sessionStorage.setItem('emergency_auth', 'true');\n                sessionStorage.setItem('emergency_timestamp', Date.now().toString());\n                \n                // Redirect with all params\n                window.location.href = '/?token=' + data.token + '&emergencyLogin=true&user=' + username + '&directAuth=true&fullToken=true';\n              } else {\n                alert('Failed to get authentication token');\n              }\n            })\n            .catch(error => {\n              console.error('Error getting token:', error);\n              alert('Error getting authentication token');\n            });\n        }\n      </script>\n    </body>\n    </html>\n  ";
    res.send(html);
});
// Emergency token generator - gives a token directly for a username
// This is the simplest possible authentication mechanism
router.get('/emergency/raw-token/:username', function (req, res) {
    var username = req.params.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    var token = generateSimpleToken(username);
    res.json({
        token: token,
        user: {
            id: -1,
            username: username,
            displayName: username,
            emergency: true
        }
    });
});
exports.emergencyLoginRouter = router;

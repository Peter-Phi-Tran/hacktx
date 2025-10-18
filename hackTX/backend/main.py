from flask import Flask, redirect, request, session, jsonify
import os
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()  # loads .env if present

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", os.environ.get("NEXTAUTH_SECRET", "dev_secret"))

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
# This must match the redirect URI you set in Google Cloud Console
REDIRECT_URI = os.environ.get("BACKEND_REDIRECT_URI", "http://localhost:5000/auth/callback")
FRONTEND_URL = os.environ.get("VITE_FRONTEND_URL", "http://localhost:3000")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env")

@app.route("/auth/google")
def auth_google():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": REDIRECT_URI,
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    # Add debug output
    print("[DEBUG] Redirect URI:", REDIRECT_URI)
    print("[DEBUG] Full auth URL:", auth_url)
    
    if request.args.get("debug") == "1":
        return jsonify({
            "redirect_uri": REDIRECT_URI,
            "auth_url": auth_url,
            "params": params
        })
    return redirect(auth_url)

@app.route("/auth/callback")
def auth_callback():
    code = request.args.get("code")
    if not code:
        return "Missing code", 400

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    token_resp = requests.post(token_url, data=data, headers=headers)
    if token_resp.status_code != 200:
        return f"Token exchange failed: {token_resp.text}", 400

    token_json = token_resp.json()
    id_token = token_json.get("id_token")
    access_token = token_json.get("access_token")

    # Verify ID token with Google's tokeninfo endpoint
    verify_resp = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
    if verify_resp.status_code != 200:
        return f"ID token verification failed: {verify_resp.text}", 400

    user_info = verify_resp.json()
    # user_info includes email, email_verified, name, picture, aud, sub, etc.

    # Create a simple server session (or issue your own JWT/session cookie)
    session["user"] = {
        "id": user_info.get("sub"),
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture")
    }
    # Optionally store tokens if you need server-side access (refresh_token may be present)
    session["tokens"] = {
        "access_token": access_token,
        "id_token": id_token,
        "raw": token_json
    }

    # Redirect to frontend (adjust path as needed)
    return redirect(f"{FRONTEND_URL}/life")

@app.route("/auth/session")
def auth_session():
    # simple endpoint frontend can hit to get session info
    user = session.get("user")
    return jsonify({"user": user})

@app.route("/auth/logout")
def auth_logout():
    session.clear()
    return redirect(FRONTEND_URL)

if __name__ == "__main__":
    # development server
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
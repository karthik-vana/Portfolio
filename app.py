import os, json, smtplib, ssl
from email.message import EmailMessage
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify, request, render_template, send_from_directory, abort
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)

app = Flask(__name__, template_folder="templates", static_folder="static")

# ---------- Load portfolio data ----------
DATA_FILE = BASE_DIR / "data" / "profile.json"
with open(DATA_FILE, "r", encoding="utf-8") as f:
    PROFILE = json.load(f)

# ---------- Routes ----------
@app.route("/")
def home():
    return render_template("index.html")

# Static resume (optional direct route)
@app.route("/resume")
def resume():
    return send_from_directory(BASE_DIR / "static" / "resume", "Karthik_Vana_Resume.pdf")

# --- API: read-only content ---
@app.route("/api/skills")
def api_skills():
    return jsonify({"skills": PROFILE.get("skills", [])})

@app.route("/api/experience")
def api_experience():
    return jsonify(PROFILE.get("experience", []))

@app.route("/api/projects")
def api_projects():
    return jsonify(PROFILE.get("projects", []))

@app.route("/api/certifications")
def api_certs():
    return jsonify(PROFILE.get("certifications", []))

# --- API: contact form ---
@app.route("/api/contact", methods=["POST"])
def api_contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not (name and email and message):
        return jsonify({"ok": False, "error": "Missing fields"}), 400

    # Save to local JSON for backup
    msg_dir = BASE_DIR / "messages"
    msg_dir.mkdir(exist_ok=True)
    store_file = msg_dir / "contacts.json"
    record = {
        "name": name,
        "email": email,
        "message": message,
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        "time": datetime.utcnow().isoformat() + "Z",
    }
    existing = []
    if store_file.exists():
        try:
            existing = json.loads(store_file.read_text(encoding="utf-8"))
        except Exception:
            existing = []
    existing.append(record)
    store_file.write_text(json.dumps(existing, indent=2), encoding="utf-8")

    # Optional: send email if SMTP env vars are set
    try:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        dest_email = os.getenv("CONTACT_DEST_EMAIL")

        if all([smtp_host, smtp_user, smtp_pass, dest_email]):
            em = EmailMessage()
            em["Subject"] = f"Portfolio Contact → {name}"
            em["From"] = smtp_user
            em["To"] = dest_email
            em.set_content(f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}\n\nTime: {record['time']}")

            context = ssl.create_default_context()
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls(context=context)
                server.login(smtp_user, smtp_pass)
                server.send_message(em)
    except Exception as e:
        # Do not fail the request if email fails—it's already stored locally.
        app.logger.warning(f"Email send failed: {e}")

    return jsonify({"ok": True})
    
# Health check for cloud
@app.route("/healthz")
def health():
    return jsonify({"status": "ok"})

# 404 friendly
@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)

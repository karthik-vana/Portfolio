# Karthik Vana — Portfolio (Flask)

Modern animated portfolio with a Flask API backend.
- Frontend: `templates/index.html`, `static/css/styles.css`, `static/js/script.js`
- Data: `data/profile.json`
- Contact: saves messages to `messages/contacts.json` and optionally emails via SMTP if `.env` is set.

## Local Setup
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# (optional) copy .env.example to .env and set credentials
python app.py

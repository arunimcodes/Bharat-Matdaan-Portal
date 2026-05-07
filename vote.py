import os
import uuid
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)

# Allow both common Live Server origins
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500",
                   "http://127.0.0.1:5501", "http://localhost:5501"])

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'matdaan.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# In-memory token store: { token_string: voter_db_id }
# This lives as long as the Flask process runs — fine for a demo.
active_tokens = {}


class Voter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    voter_id_card = db.Column(db.String(10), unique=True, nullable=False)
    aadhar_number = db.Column(db.String(12), unique=True, nullable=False)
    has_voted = db.Column(db.Boolean, default=False)


class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.String(50), nullable=False)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    voter = Voter.query.filter_by(aadhar_number=data.get('aadhar')).first()

    if not voter:
        return jsonify({"status": "error", "message": "Record not found."}), 404

    if voter.has_voted:
        return jsonify({"status": "error", "message": "This Aadhaar has already voted."}), 403

    # Issue a fresh token and store it server-side
    token = str(uuid.uuid4())
    active_tokens[token] = voter.id
    print(f">>> LOGIN: {voter.name} | token={token[:8]}…")

    return jsonify({"status": "success", "name": voter.name, "voter_token": token})


@app.route('/api/cast-vote', methods=['POST'])
def cast_vote():
    data = request.json or {}
    token = data.get('voter_token')

    if not token or token not in active_tokens:
        return jsonify({"status": "error", "message": "Session expired or invalid token."}), 401

    voter_pk = active_tokens[token]

    try:
        voter = db.session.get(Voter, voter_pk)
        if not voter:
            return jsonify({"status": "error", "message": "Voter record missing."}), 404

        if voter.has_voted:
            # Invalidate token so it can't be reused
            active_tokens.pop(token, None)
            return jsonify({"status": "error", "message": "Already voted."}), 403

        voter.has_voted = True
        print(f">>> DATABASE UPDATE: {voter.name} marked as voted.")

        new_vote = Vote(candidate_id=data.get('candidate_id', 'unknown'))
        db.session.add(new_vote)
        db.session.commit()

        # Invalidate token after successful vote (one vote per login)
        active_tokens.pop(token, None)

        return jsonify({"status": "success"})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
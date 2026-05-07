from vote import db, Voter, app
import random

def seed_voters():
    with app.app_context():
        # WARNING: This wipes the table to ensure a clean 100-voter list
        db.drop_all() 
        db.create_all()

        first_names = ["Aarav", "Ananya", "Ishaan", "Saanvi", "Aditya", "Diya", "Arjun", "Kavya", "Rohan", "Myra"]
        last_names = ["Sharma", "Verma", "Gupta", "Das", "Chatterjee", "Mehta", "Sen", "Goel"]

        print("🌱 Seeding 100 voters into matdaan.db...")
        
        for i in range(100):
            # 1. Generate Aadhaar: 100000000000 to 100000000099
            aadhaar = str(100000000000 + i)
            
            # 2. Generate Voter ID: IND0000000 to IND0000099 (Validates as 3 Letters + 7 Digits)
            v_id = f"IND{str(i).zfill(7)}"
            
            # 3. Random Name
            full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            v = Voter(
                name=full_name, 
                voter_id_card=v_id, 
                aadhar_number=aadhaar, 
                has_voted=False
            )
            db.session.add(v)
        
        db.session.commit()
        print("✅ 100 Voters created successfully!")
        print(f"Sample Login -> Aadhaar: 100000000000 | Voter ID: IND0000000")

if __name__ == "__main__":
    seed_voters()
#!/usr/bin/env python3
"""
Script to create an admin user in the database.
Usage: python create_admin.py <email> <password> <name>
"""

import sys
from app import app
from models import db, User

def create_admin(email, password, name):
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"User with email {email} already exists. Updating to admin...")
            existing_user.role = 'admin'
            existing_user.set_password(password)
            db.session.commit()
            print(f"User {email} updated to admin role.")
        else:
            # Create new admin user
            admin = User(
                email=email,
                name=name,
                role='admin'
            )
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            print(f"Admin user {email} created successfully!")

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <email> <password> <name>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    name = sys.argv[3]
    
    create_admin(email, password, name)


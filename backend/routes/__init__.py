from flask import Blueprint
from routes.auth import auth_bp
from routes.courses import courses_bp
from routes.enrollments import enrollments_bp
from routes.admin import admin_bp
from routes.checkin import checkin_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(enrollments_bp, url_prefix='/api/enrollments')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(checkin_bp, url_prefix='/api/checkin')


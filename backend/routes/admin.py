from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from models import db, Course, Enrollment, User

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get analytics for all courses (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    courses = Course.query.all()
    
    analytics = []
    for course in courses:
        enrollments = Enrollment.query.filter_by(course_id=course.id).all()
        checked_in_count = len([e for e in enrollments if e.checked_in])
        
        analytics.append({
            'course_id': course.id,
            'course_title': course.title,
            'total_enrolled': len(enrollments),
            'checked_in': checked_in_count,
            'not_checked_in': len(enrollments) - checked_in_count,
            'capacity': course.capacity,
            'attendance_rate': (checked_in_count / len(enrollments) * 100) if enrollments else 0
        })
    
    return jsonify(analytics), 200

@admin_bp.route('/course/<int:course_id>/analytics', methods=['GET'])
@jwt_required()
def get_course_analytics(course_id):
    """Get detailed analytics for a specific course (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    course = Course.query.get_or_404(course_id)
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    
    checked_in = [e.to_dict() for e in enrollments if e.checked_in]
    not_checked_in = [e.to_dict() for e in enrollments if not e.checked_in]
    
    return jsonify({
        'course': course.to_dict(),
        'total_enrolled': len(enrollments),
        'checked_in_count': len(checked_in),
        'not_checked_in_count': len(not_checked_in),
        'checked_in_students': checked_in,
        'not_checked_in_students': not_checked_in,
        'attendance_rate': (len(checked_in) / len(enrollments) * 100) if enrollments else 0
    }), 200

@admin_bp.route('/course/<int:course_id>/reminders', methods=['POST'])
@jwt_required()
def send_reminders(course_id):
    """Send reminder emails to enrolled students (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    course = Course.query.get_or_404(course_id)
    enrollments = Enrollment.query.filter_by(course_id=course_id).all()
    
    if not enrollments:
        return jsonify({'error': 'No enrollments found for this course'}), 404
    
    sent_count = 0
    failed_count = 0
    
    from app import mail
    
    for enrollment in enrollments:
        try:
            student = enrollment.student
            msg = Message(
                subject=f'Reminder: {course.title}',
                recipients=[student.email],
                body=f'''Hello {student.name},

This is a reminder that you are enrolled in the workshop:

{course.title}
Date: {course.start_time.strftime('%Y-%m-%d %H:%M')}
Location: {course.location or 'TBA'}

Please make sure to arrive on time and bring your QR code for check-in.

See you there!
'''
            )
            mail.send(msg)
            sent_count += 1
        except Exception as e:
            print(f"Failed to send email to {enrollment.student.email}: {str(e)}")
            failed_count += 1
    
    return jsonify({
        'message': f'Reminders sent: {sent_count}, Failed: {failed_count}',
        'sent_count': sent_count,
        'failed_count': failed_count
    }), 200


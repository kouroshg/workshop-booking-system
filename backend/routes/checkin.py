from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Enrollment, User
from datetime import datetime

checkin_bp = Blueprint('checkin', __name__)

@checkin_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_checkin():
    """Verify and process check-in using QR code data (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    qr_data = data.get('qr_code_data')
    
    if not qr_data:
        return jsonify({'error': 'QR code data required'}), 400
    
    # Find enrollment by QR code data
    enrollment = Enrollment.query.filter_by(qr_code_data=qr_data).first()
    
    if not enrollment:
        return jsonify({'error': 'Invalid QR code'}), 404
    
    if enrollment.checked_in:
        return jsonify({
            'message': 'Already checked in',
            'enrollment': enrollment.to_dict()
        }), 200
    
    # Process check-in
    enrollment.checked_in = True
    enrollment.checked_in_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Check-in successful',
        'enrollment': enrollment.to_dict()
    }), 200

@checkin_bp.route('/scan', methods=['POST'])
def scan_qr_code():
    """Public endpoint to scan QR code (returns enrollment info without checking in)"""
    data = request.get_json()
    qr_data = data.get('qr_code_data')
    
    if not qr_data:
        return jsonify({'error': 'QR code data required'}), 400
    
    enrollment = Enrollment.query.filter_by(qr_code_data=qr_data).first()
    
    if not enrollment:
        return jsonify({'error': 'Invalid QR code'}), 404
    
    return jsonify({
        'enrollment': enrollment.to_dict(),
        'checked_in': enrollment.checked_in
    }), 200


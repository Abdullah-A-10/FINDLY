// components/FinderInfoModal.js
import React from 'react';
import { Modal, Button, Image } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaUser } from 'react-icons/fa';
import { BACKEND_URL } from '../api';

const FinderInfoModal = ({ show, onHide, finder }) => {
  if (!finder) return null;

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaUser className="me-2" />
          Finder Contact Info
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        {finder.profile_pic && (
          <Image 
            src={`${BACKEND_URL}/${finder.profile_pic}`} 
            roundedCircle 
            width={100} 
            height={100} 
            className="mb-3"
          />
        )}
        <h5 className="mb-2">{finder.username}</h5>
        <p className="mb-1"><FaEnvelope className="me-2" /> {finder.email}</p>
        <p className="mb-1"><FaPhone className="me-2" /> {finder.phone}</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FinderInfoModal;

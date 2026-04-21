import React from 'react';
import {
  Modal,
  Row,
  Col,
  Button,
  Alert,
  Badge,
  Carousel
} from 'react-bootstrap';
import {
  FaTag,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaImage
} from 'react-icons/fa';
import { BACKEND_URL } from '../api';

import {
  getImageUrls,
  formatDate,
  STATUS_BADGE_COLORS,
  getItemLocation,
  getItemDate
} from '../utils/itemHelpers';

/* ================= Component ================= */

const StatusBadge = ({ status, type }) => (
  <Badge bg={STATUS_BADGE_COLORS[type][status] || 'secondary'} className="status_badge">
    {status}
  </Badge>
);

const ItemDetailsModal = ({
  show,
  onHide,
  item,
  type,
  onClaim,
  carouselIndex,
  onSelectCarousel,
  onPrevCarousel,
  onNextCarousel,
  claimNotice,  
  onClaimNoticeClose
}) => {
  if (!item) return null;

  const images = getImageUrls(item.image_urls);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className='modal-header' closeButton>
        <div className='d-flex justify-content-between align-items-center w-100'>
          {/* Left side: Icon + Title */}
          <div className='d-flex align-items-center'>
            <FaTag className="me-2" size={24} />
            <Modal.Title className="mb-0">{item.item_name}</Modal.Title>
          </div>

          {/* Right side: Status Badge */}
          <StatusBadge status={item.status} type={type} />
        </div>
      </Modal.Header>

      <Modal.Body>
        <Row>
          {/* Images */}
          <Col md={6}>
            {images.length ? (
              <Carousel
                activeIndex={carouselIndex}
                onSelect={onSelectCarousel}
                controls={images.length > 1}
                indicators={images.length > 1}
                prevIcon={
                  <Button variant="dark" onClick={onPrevCarousel}>
                    <FaChevronLeft />
                  </Button>
                }
                nextIcon={
                  <Button variant="dark" onClick={onNextCarousel}>
                    <FaChevronRight />
                  </Button>
                }
              >
                {images.map((src, i) => (
                  <Carousel.Item key={i}>
                    <img
                      src={src}
                      alt={`item-${i}`}
                      className="w-100 rounded"
                      style={{ maxHeight: 350, objectFit: 'cover' }}
                    />
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <div className="text-center text-muted py-5">
                <FaImage size={60} />
                <p>No images available</p>
              </div>
            )}
          </Col>

          {/* Details */}
          <Col md={6}>
            <p>
              <FaTag className="me-2" size={22} />
              {item.category}
            </p>

            <p>
              <FaMapMarkerAlt className="me-2" size={22} />
              {getItemLocation(item, type)}
            </p>

            <p>
              <FaCalendarAlt className="me-2" size={22} />
              {formatDate(getItemDate(item, type))}
            </p>

            <p>
              <FaClock className="me-2" size={22} />
              Reported on {formatDate(item.created_at)}
            </p>
            <p className="modal-desc text-muted">" {item.description} "</p>

            {type === 'found' && !item.is_public && (
              <Alert variant="warning" className="mt-3">
                This item is in a private match window.
              </Alert>
            )}

            {/* Claim Notice - Only show when there's a message */}
            {claimNotice && claimNotice.info && (
              <Alert 
                variant={claimNotice.type} 
                className="mt-3"
                onClose={onClaimNoticeClose}
                dismissible
              >
                {claimNotice.info}
              </Alert>
            )}
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>

        {type === 'found' && item.status === 'Reported' && (
          <Button variant="success" onClick={onClaim}>
            <FaBell className="me-2" />
            Claim Item
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export { ItemDetailsModal, StatusBadge };
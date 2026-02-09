import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaEye, FaBoxOpen, FaListAlt } from 'react-icons/fa';
import api from '../api';
import { getImageUrls, formatDate } from '../utils/itemHelpers';
import { ItemDetailsModal, StatusBadge } from '../components/ItemDetailsModal';
import './MyListings.css';

const MyListings = () => {
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState({ lost: [], found: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchListings(activeTab);
  }, [activeTab]);

  const fetchListings = async (type) => {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        type === 'lost'
          ? '/items/mylistings/lost'
          : '/items/mylistings/found';

      const res = await api.get(endpoint);
      setItems(prev => ({ ...prev, [type]: res.data[type + 'Items'] || [] }));
    } catch (err) {
      setError('No items found.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const ItemCard = ({ item, type }) => {
    const image = getImageUrls(item.image_urls)[0];

    return (
      <Col md={4} lg={3} className="mb-4">
        <Card className="mylisting-card h-100">
          <div className="mylisting-image">
            {image ? (
              <img src={image} alt={item.item_name} />
            ) : (
              <div className="no-image">No Image</div>
            )}
            <div className='item_status_badge'>
              <StatusBadge status={item.status} type={type} />
            </div>
          </div>

          <Card.Body className="d-flex flex-column">
            <h6 className="mb-1">{item.item_name}</h6>
            <small className="text-muted mb-2">{item.category}</small>

            <small className="text-muted">
              {type === 'lost' ? 'Lost' : 'Found'} on {formatDate(
                type === 'lost' ? item.lost_date : item.found_date
              )}
            </small>

            <Button
              variant="outline-primary"
              size="sm"
              className="mt-auto"
              onClick={() => openDetails(item)}
            >
              <FaEye className="me-1" /> View
            </Button>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const currentItems = items[activeTab];

  return (
    <div className="mylistings-page">
    <Container className="py-5">
      <h2 className="page-title mb-4"> <FaListAlt className='me-3'/>My Listings</h2>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab
          eventKey="lost"
          title={
            <>
              Lost <Badge bg="danger">{items.lost.length}</Badge>
            </>
          }
        />
        <Tab
          eventKey="found"
          title={
            <>
              Found <Badge bg="success">{items.found.length}</Badge>
            </>
          }
        />
      </Tabs>

      {loading && (
        <div className="text-center py-5">
          <Spinner />
        </div>
      )}

      {error && !loading && (
        <Alert variant="secondary" className="text-center">
          <FaBoxOpen size={40} className="mb-2" />
          <p className="mb-0">{error}</p>
        </Alert>
      )}

      {!loading && !error && (
        <Row>
          {currentItems.map(item => (
            <ItemCard key={item.id} item={item} type={activeTab} />
          ))}
        </Row>
      )}

      <ItemDetailsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        item={selectedItem}
        type={activeTab}
      />
    </Container>
    </div>
  );
};

export default MyListings;

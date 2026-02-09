import React, { useState, useEffect, useContext } from 'react';
import {
  getImageUrls,
  formatDate,
  getItemLocation,
  getItemDate
} from '../utils/itemHelpers';
import {ItemDetailsModal , StatusBadge} from '../components/ItemDetailsModal';
import {
  Container,
  Row,
  Col,
  Card,
  Tabs,
  Tab,
  Form,
  Button,
  Badge,
  InputGroup,
  Spinner,
  Alert,
  Modal,
  Dropdown,
  Pagination,
} from 'react-bootstrap';
import {
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaEye,
  FaPlus,
  FaTimes,
  FaSortAmountDown,
  FaSortAmountUp,
  FaImage,
  FaClock,
  FaBell,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import './Listings.css';

// Constants
const CATEGORIES = [
  'Electronics',
  'Documents',
  'Jewelry',
  'Clothing',
  'Accessories',
  'Bags & Wallets',
  'Keys',
  'Books',
  'Toys',
  'Sports Equipment',
  'Other'
];

const STATUS_OPTIONS = {
  lost: ['Lost', 'Matched', 'Claimed'],
  found: ['Reported', 'Matched', 'Returned']
};


const Listings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState('lost');
  const [items, setItems] = useState({ lost: [], found: [] });
  const [filteredItems, setFilteredItems] = useState({ lost: [], found: [] });
  const [loading, setLoading] = useState({ lost: true, found: true });
  const [error, setError] = useState({ lost: '', found: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [claimNotice , setClaimNotice] = useState({type:" ", info:" "});
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  
  const [pagination, setPagination] = useState({
    lost: { page: 1, limit: 12, total: 0, totalPages: 1 },
    found: { page: 1, limit: 12, total: 0, totalPages: 1 }
  });
  
  const [sortConfig, setSortConfig] = useState({
    lost: { field: 'created_at', direction: 'desc' },
    found: { field: 'created_at', direction: 'desc' }
  });
  
  // Fetch items
  useEffect(() => {
    if (user) {
      fetchItems(activeTab);
    }
  }, [user, activeTab, pagination[activeTab].page]);

  const fetchItems = async (tab) => {
    const loadingKey = tab === 'lost' ? 'lost' : 'found';
    const errorKey = tab === 'lost' ? 'lost' : 'found';
    
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setError(prev => ({ ...prev, [errorKey]: '' }));
    
    try {
      const params = new URLSearchParams({
        page: pagination[tab].page,
        limit: pagination[tab].limit,
        ...(filters.search && { item_name: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.location && { location: filters.location }),
        ...(filters.startDate && { start_date: filters.startDate }),
        ...(filters.endDate && { end_date: filters.endDate }),
        ...(filters.status && { status: filters.status })
      }).toString();

      const endpoint = tab === 'lost' ? '/items/lost/search' : '/items/found/search';
      const response = await api.get(`${endpoint}?${params}`);
      
      const itemsList = response.data.items || [];
      setItems(prev => ({ ...prev, [tab]: itemsList }));
      setFilteredItems(prev => ({ ...prev, [tab]: itemsList }));
      
      setPagination(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 1
        }
      }));
    } catch (err) {
      const errorMsg = `Failed to load ${tab} items. Please try again.`;
      setError(prev => ({ ...prev, [errorKey]: errorMsg }));
      console.error(`Error fetching ${tab} items:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({
      lost: { ...prev.lost, page: 1 },
      found: { ...prev.found, page: 1 }
    }));
    fetchItems(activeTab);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    
    setPagination(prev => ({
      lost: { ...prev.lost, page: 1 },
      found: { ...prev.found, page: 1 }
    }));
    
    fetchItems(activeTab);
    setShowFilters(false);
  };

  const handleSort = (field) => {
    const currentConfig = sortConfig[activeTab];
    const direction = currentConfig.field === field && currentConfig.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig(prev => ({
      ...prev,
      [activeTab]: { field, direction }
    }));

    const itemsToSort = [...filteredItems[activeTab]];
    
    const sortedItems = itemsToSort.sort((a, b) => {
      if (field === 'created_at') {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (field === 'item_name') {
        const nameA = a.item_name.toLowerCase();
        const nameB = b.item_name.toLowerCase();
        if (nameA < nameB) return direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return direction === 'asc' ? 1 : -1;
        return 0;
      }
      
      return 0;
    });

    setFilteredItems(prev => ({ ...prev, [activeTab]: sortedItems }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], page }
    }));
  };

  const viewItemDetails = (item) => {
    setSelectedItem(item);
    setCarouselIndex(0); 
    setShowItemModal(true);
  };

  const handleClaimItem = async (foundItemId) => {
  try {
    // Clear previous notices
    setClaimNotice({
      type: 'info',
      info: 'Checking for a matching lost item...'
    });

    const response = await api.post('/items/claim/public', {
      found_item_id: foundItemId
    });

    const { status, match_id, error, message } = response.data;

    // New match created - show success and navigate
    if (status === 'match_created') {
      setClaimNotice({
        type: 'success',
        info: 'Potential match found! Please verify ownership.'
      });
      
      // Give user time to see the message before navigating
      setTimeout(() => {
        navigate('/matches');
      }, 1500);
      
      return;
    }

    // Match already exists
    if (status === 'match_exists') {
      setClaimNotice({
        type: 'info',
        info: 'You already have a match for this item. Redirecting you...'
      });

      setTimeout(() => {
        navigate('/matches');
      }, 800);
      return;
    }

    // Rejected (no lost item etc.)
    if (status === 'rejected') {
      setClaimNotice({
        type: 'warning',
        info: error || 'Unable to create a match. You may not have a matching lost item.'
      });
      return;
    }

  } catch (err) {
    setClaimNotice({
      type: 'danger',
      info: err.response?.data?.error || 'Something went wrong. Please try again later.'
    });
  }
};

  // Image carousel handlers
  const handleSelectCarousel = (selectedIndex) => {
    setCarouselIndex(selectedIndex);
  };

  const handlePrevCarousel = () => {
    const imageUrls = getImageUrls(selectedItem?.image_urls);
    setCarouselIndex(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    const imageUrls = getImageUrls(selectedItem?.image_urls);
    setCarouselIndex(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const ItemCard = ({ item, type }) => {
    const imageUrls = getImageUrls(item.image_urls);
    const firstImageUrl = imageUrls[0] || null;
    
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-4">
        <Card className="listing_card h-100">
          <div className="card-image-section">
            {firstImageUrl ? (
              <Card.Img
                variant="top"
                src={firstImageUrl}
                alt={item.item_name}
                className="item-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.no-image-placeholder') ||
                    document.createElement('div');
                  placeholder.className = 'no-image-placeholder';
                  placeholder.innerHTML = `
                    <svg width="40" height="40" viewBox="0 0 16 16" fill="#6c757d">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      <path fill-rule="evenodd" d="M.86 2.5a.5.5 0 0 1 .5-.5h14a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-14a.5.5 0 0 1-.5-.5v-10zm13 10V3H2v9.5l2.5-2.5 2 2L9 8l4.5 4.5z"/>
                    </svg>
                    <span>No Image</span>
                  `;
                  if (!e.target.parentElement.querySelector('.no-image-placeholder')) {
                    e.target.parentElement.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div className="no-image-placeholder">
                <FaImage size={40} />
                <span>No Image</span>
              </div>
            )}
            
            {imageUrls.length > 1 && (
              <Badge bg="dark" className="image-count-badge">
                {imageUrls.length} <FaImage size={12} />
              </Badge>
            )}
            
            <div className="card-overlay">
              <div className="status-overlay">
                <StatusBadge status={item.status} type={type} />
              </div>
              <Button
                variant="light"
                size="sm"
                className="view-btn"
                onClick={() => viewItemDetails(item)}
              >
                <FaEye /> View
              </Button>
            </div>
          </div>
          
          <Card.Body className="d-flex flex-column">
            <Card.Title className="item-title">
              {item.item_name}
              <small className="text-muted d-block mt-1">
                <FaTag className="me-1" /> {item.category}
              </small>
            </Card.Title>
            
            <Card.Text className="item-description flex-grow-1">
              {item.description?.length > 100
                ? `${item.description.substring(0, 50)}...`
                : item.description}
            </Card.Text>
            
            <div className="item-meta mt-auto">
              <div className="location">
                <FaMapMarkerAlt size={22} style={{color: "#212529" }}  className="me-1" />
                <small>{type === 'lost' ? item.lost_location : item.found_location}</small>
              </div>
              <div className="date">
                <FaClock className="me-1" size={22} style={{ color: "#5c5f66"}}/>
                <small>
                  {type === 'lost'
                    ? `Lost: ${formatDate(item.lost_date)}`
                    : `Found: ${formatDate(item.found_date)}`
                  }
                </small>
              </div>
              {type === 'found' && !item.is_public && (
                <div className="private-warning">
                  <FaClock className="me-1 text-warning" />
                  <small className="text-warning">Private Match Window</small>
                </div>
              )}
            </div>
            
            <div className="d-grid gap-2 mt-3">
              <Button
                variant={type === 'lost' ? 'primary' : 'success'}
                onClick={() => viewItemDetails(item)}
              >
                View Details
              </Button>
              {type === 'found' && item.status === 'Reported' && (
                <Button
                  variant="outline-success"
                  onClick={() => viewItemDetails(item)}
                >
                  <FaBell className="me-1" /> Claim This Item
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const PaginationComponent = () => {
    const currentPagination = pagination[activeTab];
    const currentItems = filteredItems[activeTab];
    
    if (currentItems.length === 0 || currentPagination.totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(currentPagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPagination.page}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    return (
      <div className="pagination-wrapper mt-4">
        <Pagination className="justify-content-center">
          <Pagination.First
            onClick={() => handlePageChange(1)}
            disabled={currentPagination.page === 1}
          />
          <Pagination.Prev
            onClick={() => handlePageChange(currentPagination.page - 1)}
            disabled={currentPagination.page === 1}
          />
          {pages}
          <Pagination.Next
            onClick={() => handlePageChange(currentPagination.page + 1)}
            disabled={currentPagination.page === currentPagination.totalPages}
          />
          <Pagination.Last
            onClick={() => handlePageChange(currentPagination.totalPages)}
            disabled={currentPagination.page === currentPagination.totalPages}
          />
        </Pagination>
        
        <div className="text-center text-muted mt-2">
          Showing {(currentPagination.page - 1) * currentPagination.limit + 1} to{' '}
          {Math.min(currentPagination.page * currentPagination.limit, currentPagination.total)} of{' '}
          {currentPagination.total} items
        </div>
      </div>
    );
  };

  const ActiveFilters = () => {
    const hasActiveFilters = filters.search || filters.category || filters.status ||
                           filters.location || filters.startDate || filters.endDate;
    
    if (!hasActiveFilters) return null;
    
    return (
      <div className="active-filters mt-3">
        <small className="text-muted me-2">Active filters:</small>
        {filters.search && (
          <Badge bg="info" className="me-2">
            Search: {filters.search}
            <FaTimes className="ms-1" onClick={() => setFilters(prev => ({ ...prev, search: '' }))} />
          </Badge>
        )}
        {filters.category && (
          <Badge bg="info" className="me-2">
            Category: {filters.category}
            <FaTimes className="ms-1" onClick={() => setFilters(prev => ({ ...prev, category: '' }))} />
          </Badge>
        )}
        {filters.status && (
          <Badge bg="info" className="me-2">
            Status: {filters.status}
            <FaTimes className="ms-1" onClick={() => setFilters(prev => ({ ...prev, status: '' }))} />
          </Badge>
        )}
        {(filters.location || filters.startDate || filters.endDate) && (
          <Badge bg="warning" className="me-2" onClick={() => setShowFilters(true)}>
            More filters active <FaFilter className="ms-1" />
          </Badge>
        )}
        <Button variant="link" size="sm" onClick={resetFilters}>
          Clear all filters
        </Button>
      </div>
    );
  };

  // Current state
  const currentItems = filteredItems[activeTab];
  const currentLoading = loading[activeTab];
  const currentError = error[activeTab];
  const totalItems = pagination[activeTab].total;
  const reportPath = activeTab === 'lost' ? '/lost/report' : '/found/report';

  return (
    <div className="listings-page">
      <Container fluid="xxl" className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="listings-header">
              <h1 className="page-title">
                {activeTab === 'lost' ? 'Lost Items' : 'Found Items'}
                <Badge bg="light" text="dark" className="ms-3">
                  {totalItems} items
                </Badge>
              </h1>
              <p className="page-subtitle">
                Browse through {activeTab} items reported by the community.
                {activeTab === 'found' && ' Some items may be in private match window.'}
              </p>
            </div>
          </Col>
          <Col xs="auto" className="d-flex align-items-center">
            <Button
              as={Link}
              to={reportPath}
              variant={activeTab === 'lost' ? 'danger' : 'success'}
              className="report-btn"
            >
              <FaPlus className="me-2" />
              Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
            </Button>
          </Col>
        </Row>

        {/* Tabs */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={setActiveTab}
              className="listings-tabs"
              fill
            >
              <Tab
                eventKey="lost"
                title={
                  <div className="tab-title">
                    <FaSearch className="me-2" />
                    Lost Items
                    <Badge bg="warning" className="ms-2">
                      {pagination.lost.total}
                    </Badge>
                  </div>
                }
              />
              <Tab
                eventKey="found"
                title={
                  <div className="tab-title">
                    <FaBell className="me-2" />
                    Found Items
                    <Badge bg="success" className="ms-2">
                      {pagination.found.total}
                    </Badge>
                  </div>
                }
              />
            </Tabs>
          </Card.Body>
        </Card>

        {/* Search and Filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col md={6} lg={4}>
                <InputGroup>
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control
                    placeholder="Search by item name..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </InputGroup>
              </Col>
              
              <Col md={4} lg={3}>
                <Form.Select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col md={2} lg={2}>
                <Form.Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS[activeTab].map((status, index) => (
                    <option key={index} value={status}>{status}</option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col md={4} lg={3} className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => setShowFilters(true)}
                  className="flex-grow-1"
                >
                  <FaFilter className="me-2" />
                  More Filters
                </Button>
                
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" id="dropdown-sort">
                    {sortConfig[activeTab].direction === 'asc' ? (
                      <FaSortAmountUp className="me-2" />
                    ) : (
                      <FaSortAmountDown className="me-2" />
                    )}
                    Sort
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleSort('created_at')}>
                      Date {sortConfig[activeTab].field === 'created_at' && sortConfig[activeTab].direction === 'desc' ? '(Newest)' : '(Oldest)'}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleSort('item_name')}>
                      Name {sortConfig[activeTab].field === 'item_name' && sortConfig[activeTab].direction === 'desc' ? '(Z-A)' : '(A-Z)'}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            
            <ActiveFilters />
          </Card.Body>
        </Card>

        {/* Loading State */}
        {currentLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading {activeTab} items...</p>
          </div>
        )}

        {/* Error State */}
        {currentError && !currentLoading && (
          <Alert variant="danger" className="text-center">
            {currentError}
            <Button variant="outline-danger" size="sm" className="ms-3" onClick={() => fetchItems(activeTab)}>
              Retry
            </Button>
          </Alert>
        )}

        {/* No Results */}
        {!currentLoading && !currentError && currentItems.length === 0 && (
          <Card className="text-center py-5">
            <Card.Body>
              <FaSearch size={60} className="text-muted mb-3" />
              <h4>No {activeTab} items found</h4>
              <p className="text-muted">
                {Object.values(filters).some(Boolean)
                  ? 'Try changing your filters or search terms.'
                  : `No ${activeTab} items have been reported yet. Be the first to report one!`
                }
              </p>
              <Button
                as={Link}
                to={reportPath}
                variant={activeTab === 'lost' ? 'danger' : 'success'}
                className="mt-3"
              >
                <FaPlus className="me-2" />
                Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Items Grid */}
        {!currentLoading && !currentError && currentItems.length > 0 && (
          <>
            <Row>
              {currentItems.map(item => (
                <ItemCard key={item.id} item={item} type={activeTab} />
              ))}
            </Row>
            <PaginationComponent />
          </>
        )}
      </Container>

      {/* Filters Modal */}
      <FiltersModal
        show={showFilters}
        onHide={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {/* Item Details Modal with Carousel */}
      <ItemDetailsModal
        show={showItemModal}
       onHide={() => {
        setShowItemModal(false);
        setClaimNotice({ type: '', info: '' }); 
       }}
        item={selectedItem}
        type={activeTab}
        onClaim={() => selectedItem && handleClaimItem(selectedItem.id)}
        carouselIndex={carouselIndex}
        onSelectCarousel={handleSelectCarousel}
        onPrevCarousel={handlePrevCarousel}
        onNextCarousel={handleNextCarousel}
        claimNotice={claimNotice} 
        onClaimNoticeClose={() => setClaimNotice({ type: '', info: '' })} 
      />
    </div>
  );
};

// Modal Components
const FiltersModal = ({ show, onHide, filters, onFilterChange, onApply, onReset }) => (
  <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>
        <FaFilter className="me-2" />
        Advanced Filters
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter location..."
              name="location"
              value={filters.location}
              onChange={onFilterChange}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Date Range</Form.Label>
            <Row className="g-2">
              <Col>
                <Form.Control
                  type="date"
                  placeholder="Start Date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={onFilterChange}
                />
              </Col>
              <Col>
                <Form.Control
                  type="date"
                  placeholder="End Date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={onFilterChange}
                />
              </Col>
            </Row>
          </Form.Group>
        </Col>
      </Row>
      
      <div className="mt-4">
        <h6>Quick Filters</h6>
        <div className="d-flex flex-wrap gap-2 mt-2">
          <Button
            variant={filters.startDate ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => {
              const today = new Date();
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              onFilterChange({
                target: {
                  name: 'startDate',
                  value: weekAgo.toISOString().split('T')[0]
                }
              });
              onFilterChange({
                target: {
                  name: 'endDate',
                  value: today.toISOString().split('T')[0]
                }
              });
            }}
          >
            Last 7 Days
          </Button>
          <Button
            variant={filters.startDate ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => {
              const today = new Date();
              const monthAgo = new Date(today);
              monthAgo.setDate(today.getDate() - 30);
              onFilterChange({
                target: {
                  name: 'startDate',
                  value: monthAgo.toISOString().split('T')[0]
                }
              });
              onFilterChange({
                target: {
                  name: 'endDate',
                  value: today.toISOString().split('T')[0]
                }
              });
            }}
          >
            Last 30 Days
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              onFilterChange({ target: { name: 'startDate', value: '' } });
              onFilterChange({ target: { name: 'endDate', value: '' } });
            }}
          >
            Clear Dates
          </Button>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Cancel</Button>
      <Button variant="outline-secondary" onClick={onReset}>Reset All</Button>
      <Button variant="primary" onClick={onApply}>Apply Filters</Button>
    </Modal.Footer>
  </Modal>
);


export default Listings;
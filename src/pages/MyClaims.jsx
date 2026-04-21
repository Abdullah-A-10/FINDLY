import React, { useEffect, useState } from "react";
import api from "../api";
import "./MyClaims.css";
import { FaBookmark } from "react-icons/fa";

const MyClaims = () => {
  const [claimsMade, setClaimsMade] = useState([]);
  const [claimsReceived, setClaimsReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get("/items/myclaims");
        setClaimsMade(res.data.claims_made || []);
        setClaimsReceived(res.data.claims_received || []);
      } catch (err) {
        console.error("Error fetching claims", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  if (loading) {
    return <div className="myclaims-loading">Loading claims...</div>;
  }

  return (
    <div className="myclaims-container">
      <h2 className="myclaims-title"><FaBookmark/>  My Claims</h2>

      {/* Claims Made */}
      <section className="myclaims-section">
        <h3>Claims I Made</h3>

        <div className="myclaims-grid">
          {claimsMade.length === 0 && (
            <p className="empty-text">You haven’t made any claims yet.</p>
          )}

          {claimsMade.map((claim) => (
            <div className="myclaims-card" key={claim.claim_id}>
              <span className={`status-badge ${claim.claim_status}`}>
                {claim.claim_status}
              </span>

              <h4>{claim.found_item_name}</h4>
              <p className="category">{claim.found_item_category}</p>

              <div className="meta">
                <p><strong>Finder:</strong> {claim.finder_username}</p>
                {claim.claim_status=="Approved" &&
                <p><strong>Contact:</strong> {claim.finder_phone}</p>}
                <p><strong>Location:</strong> {claim.found_location}</p>
                <p><strong>Date:</strong> {new Date(claim.claim_date).toDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Claims Received */}
      <section className="myclaims-section">
        <h3>Claims on My Found Items</h3>

        <div className="myclaims-grid">
          {claimsReceived.length === 0 && (
            <p className="empty-text">No one has claimed your items yet.</p>
          )}

          {claimsReceived.map((claim) => (
            <div className="myclaims-card" key={claim.claim_id}>
              <span className={`status-badge ${claim.claim_status}`}>
                {claim.claim_status}
              </span>

              <h4>{claim.found_item_name}</h4>
              <p className="category">{claim.found_item_category}</p>

              <div className="meta">
                <p><strong>Claimer:</strong> {claim.claimer_username}</p>
                {claim.claim_status=="Approved" &&
                <p><strong>Contact:</strong> {claim.claimer_phone}</p>}
                <p><strong>Location:</strong> {claim.found_location}</p>
                <p><strong>Date:</strong> {new Date(claim.claim_date).toDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyClaims;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetApplicantDetailsQuery } from "../slices/applicantsApiSlice";
import { useGetUserCompanyInfoQuery } from "../slices/companyApiSlice";
import { useUpdateApplicationStatusMutation } from "../slices/applicantsApiSlice";
import Loader from "../components/Loader";
import ErrorScreen from "../screens/ErrorScreen";
import { Container, Row, Col, Button, Card, Badge} from "react-bootstrap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Applicants = () => {
  const { jobId } = useParams();
  const { data, isLoading, isError } = useGetApplicantDetailsQuery(jobId);
  const { data: companyInfo } = useGetUserCompanyInfoQuery();
  const [updateStatus] = useUpdateApplicationStatusMutation();
  const [applicants, setApplicants] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (data && data.success) {
      setApplicants(data.application);
    } else {
      setApplicants([]);
    }
  }, [data]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await updateStatus({ applicationId, status: newStatus }).unwrap();
      // Update local state after successful status update
      setApplicants(prevApplicants =>
        prevApplicants.map(application =>
          application._id === applicationId
            ? { ...application, status: newStatus }
            : application
        )
      );
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const exportToExcel = () => {
    const formattedData = applicants.map((app) => ({
      Name: app.applicant.name,
      Email: app.applicant.email,
      Phone: app.applicant.phone || "N/A",
      Location: app.applicant.location || "N/A",
      Status: app.status,
      Resume: app.applicant.resume || "No Resume",
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "applicants_data.xlsx");
  };

  if (isLoading || !applicants) {
    return <Loader />;
  }

  if (isError) {
    return <ErrorScreen onRetry={() => window.location.reload()} />;
  }

  if (applicants.length === 0) {
    return <Container className="mt-4"><h3>No applicants found for this job yet</h3></Container>;
  }

  // Helper function to get badge variant based on status
  const getStatusVariant = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Applicants</h2>
          <Badge bg="primary" className="ms-2">
            Total Applicants: {applicants.length}
          </Badge>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={exportToExcel}>
            📥 Download Excel
          </Button>
        </Col>
      </Row>

      {applicants.map((data) => (
        <Card 
          key={data.applicant.email} 
          className="mb-3" 
          onClick={() => toggleExpand(data.applicant.email)}
          style={{ cursor: 'pointer' }}
        >
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="avatar me-3">
                {data.applicant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <Card.Title>{data.applicant.name}</Card.Title>
                <Badge bg={getStatusVariant(data.status)}>
                  {data.status}
                </Badge>
              </div>
            </div>
            <span>{expandedId === data.applicant.email ? "▲" : "▼"}</span>
          </Card.Header>
          
          {expandedId === data.applicant.email && (
            <Card.Body>
              <p><strong>Email:</strong> {data.applicant.email}</p>
              
              {data.applicant.phone && (
                <p><strong>Phone:</strong> {data.applicant.phone}</p>
              )}
              
              {data.applicant.location && (
                <p><strong>Location:</strong> {data.applicant.location}</p>
              )}
              
              {data.applicant.resume && (
                <p>
                  <strong>Resume:</strong>
                  <a href={data.applicant.resume} target="_blank" rel="noopener noreferrer" className="ms-2">
                    View Resume
                  </a>
                </p>
              )}
              
              {/* Status Update Buttons for Company Admin */}
              {companyInfo && (
                <div className="mt-3">
                  <strong>Update Status:</strong>
                  <div className="d-flex gap-2 mt-2">
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={() => handleStatusUpdate(data._id, 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleStatusUpdate(data._id, 'rejected')}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="warning" 
                      size="sm" 
                      onClick={() => handleStatusUpdate(data._id, 'pending')}
                    >
                      Pending
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          )}
        </Card>
      ))}
    </Container>
  );
};

export default Applicants;

"use client"; // This directive is necessary for using client-side code

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Tabs, Tab, Button } from "react-bootstrap";
import CreateChannel from "./CreateChannel"; // Adjust the path if necessary
import DeployChaincode from "./DeployChaincode";

const AdminDashboard = () => {
  const [enrollmentID, setEnrollmentID] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setEnrollmentID("Admin" || null);
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <Container fluid className="mt-5">
      <Row>
        <Col>
          <h1>Admin Dashboard</h1>
        </Col>
        <Col className="text-end d-flex align-items-center justify-content-end">
          {enrollmentID && (
            <p className="mb-0 me-3">Enrollment ID: {enrollmentID}</p>
          )}
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Col>
      </Row>
      <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
        <Card.Body>
          <Tabs
            defaultActiveKey="CreateChannel"
            id="dashboard-tabs"
            className="mb-3"
            variant="tabs"
            justify
            style={{ borderBottom: "2px solid #99adf0" }}
          >
            <Tab
              eventKey="CreateChannel"
              title="Create Channel"
              tabClassName="custom-tab"
            >
              <CreateChannel />
            </Tab>
            <Tab
              eventKey="DeployChaincode"
              title="Deploy Chaincode"
              tabClassName="custom-tab"
            >
              <DeployChaincode />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;

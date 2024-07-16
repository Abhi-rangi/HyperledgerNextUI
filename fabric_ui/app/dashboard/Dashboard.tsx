"use client"; // This directive is necessary for using client-side code

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Tabs, Tab, Button } from "react-bootstrap";
import CreatePatient from "./CreatePatient";
import SearchPatient from "./SearchPatient";
import AppendData from "./AppendData";
import ShowAllPatients from "./ShowAllPatients";

const Dashboard = () => {
  const [enrollmentID, setEnrollmentID] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const enrollmentID = Cookies.get("enrollmentID");
    setEnrollmentID(enrollmentID || null);
  }, []);

  const handleLogout = () => {
    Cookies.remove("org");
    Cookies.remove("enrollmentID");
    router.push("/login");
  };

  return (
    <Container fluid className="mt-5">
      <Row>
        <Col>
          <h1>Dashboard</h1>
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
            defaultActiveKey="createPatient"
            id="dashboard-tabs"
            className="mb-3"
          >
            <Tab eventKey="createPatient" title="Create Patient">
              <CreatePatient />
            </Tab>
            <Tab eventKey="searchPatient" title="Search Patient">
              <SearchPatient />
            </Tab>
            <Tab eventKey="appendData" title="Append Data">
              <AppendData />
            </Tab>
            <Tab eventKey="showAllPatients" title="Show All Patients">
              <ShowAllPatients />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;

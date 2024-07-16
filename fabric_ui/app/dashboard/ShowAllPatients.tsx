"use client"; // This directive is necessary for using client-side code

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Alert, Table } from "react-bootstrap";
import Cookies from "js-cookie";

const ShowAllPatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setErrorMessage(null);

      const org = Cookies.get("org");
      const identityName = Cookies.get("enrollmentID");

      if (!org || !identityName) {
        setErrorMessage("Organization and identity name are required.");
        return;
      }

      const url = "http://localhost:3001/get-all-patients";

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            org: org,
            identityname: identityName,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        } else {
          const errorData = await response.text();
          setErrorMessage(errorData);
        }
      } catch (error) {
        setErrorMessage(
          "An error occurred while fetching patients. Please try again."
        );
        console.error("Error:", error);
      }
    };

    fetchPatients();
  }, []);

  const renderAddress = (address: any) => {
    if (Array.isArray(address)) {
      return address.map((addr, index) => (
        <div key={index}>
          {addr.line?.join(", ")}, {addr.city}, {addr.state}, {addr.postalCode},{" "}
          {addr.country}
        </div>
      ));
    } else {
      return (
        <div>
          {address.line?.join(", ")}, {address.city}, {address.state},{" "}
          {address.postalCode}, {address.country}
        </div>
      );
    }
  };

  const renderName = (name: any) => {
    if (Array.isArray(name)) {
      return name.map((n, index) => (
        <div key={index}>
          {n.family}, {n.given?.join(" ")}
        </div>
      ));
    } else {
      return (
        <div>
          {name.family}, {name.given?.join(" ")}
        </div>
      );
    }
  };

  const renderObservations = (observations: any[]) => {
    return observations.map((obs, index) => (
      <div key={index}>
        <strong>Type:</strong> {obs.type}, <strong>Value:</strong> {obs.value}{" "}
        {obs.unit}, <strong>Timestamp:</strong>{" "}
        {new Date(obs.timestamp).toLocaleString()}
      </div>
    ));
  };

  return (
    <Container fluid className="mt-5">
      <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
        <Card.Body>
          <Row>
            <Col>
              <h1>All Patients</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {patients.length > 0 ? (
                <Table striped bordered hover className="mt-4">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Birth Date</th>
                      <th>Address</th>
                      <th>Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr key={index}>
                        <td>{patient.id}</td>
                        <td>{renderName(patient.name)}</td>
                        <td>{patient.gender}</td>
                        <td>{patient.birthDate}</td>
                        <td>{renderAddress(patient.address)}</td>
                        <td>{renderObservations(patient.observations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No patients found.</p>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ShowAllPatients;

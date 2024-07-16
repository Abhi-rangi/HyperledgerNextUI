"use client"; // This directive is necessary for using client-side code

import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Table,
} from "react-bootstrap";
import Cookies from "js-cookie";

const SearchPatient = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [jsonData, setJsonData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null); // Reset error message
    try {
      const org = Cookies.get("org");
      const enrollmentID = Cookies.get("enrollmentID");

      if (!org || !enrollmentID) {
        setErrorMessage("Organization and enrollment ID are required.");
        return;
      }

      const response = await fetch(
        `http://localhost:3001/get-patient/${searchQuery}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            org: org!,
            identityname: enrollmentID!,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setJsonData(data);
      } else {
        const errorData = await response.text();
        setErrorMessage(errorData || "Error fetching data");
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while fetching data. Please try again."
      );
      console.error("Error:", error);
    }
  };

  const renderPatientData = (data: any) => {
    return (
      <Table striped bordered hover className="mt-4">
        <tbody>
          <tr>
            <td>ID</td>
            <td>{data.id}</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>
              {data.name?.[0]?.family}, {data.name?.[0]?.given?.join(" ")}
            </td>
          </tr>
          <tr>
            <td>Gender</td>
            <td>{data.gender}</td>
          </tr>
          <tr>
            <td>Birth Date</td>
            <td>{data.birthDate}</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>
              {data.address?.map((addr: any, index: number) => (
                <div key={index}>
                  {addr.line?.join(", ")}, {addr.city}, {addr.state},{" "}
                  {addr.postalCode}, {addr.country}
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td>Identifier</td>
            <td>{data.identifier?.[0]?.value}</td>
          </tr>
          <tr>
            <td>Observations</td>
            <td>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.observations?.map((obs: any, index: number) => (
                    <tr key={index}>
                      <td>{obs.type}</td>
                      <td>{obs.value}</td>
                      <td>{obs.unit}</td>
                      <td>{new Date(obs.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  };

  return (
    <Container fluid className="mt-5">
      <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
        <Card.Body>
          <Row>
            <Col>
              <h1>Search Patient</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <Form onSubmit={handleSearch}>
                <Form.Group className="mb-4" controlId="formSearch">
                  <Form.Label>Search for Patient by ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter patient ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Search
                </Button>
              </Form>
              {jsonData && renderPatientData(jsonData)}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SearchPatient;

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
                    // Inline style for width
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
              {jsonData && (
                <pre style={{ textAlign: "left", width: "100%" }}>
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SearchPatient;

"use client"; // This directive is necessary for using client-side code

import React, { useState, ChangeEvent, FormEvent } from "react";
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

const AppendData = () => {
  const [patientId, setPatientId] = useState<string>("");
  const [observationData, setObservationData] = useState({
    type: "",
    value: "",
    unit: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "patientId") {
      setPatientId(value);
    } else {
      setObservationData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const org = Cookies.get("org");
    const identityName = Cookies.get("enrollmentID");

    if (!org || !identityName) {
      setErrorMessage("Organization and identity name are required.");
      return;
    }

    const url = "http://localhost:3001/append-observation";
    const body = {
      org,
      identityName,
      patientId,
      observationData,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      if (response.ok) {
        setSuccessMessage("Observation data has been appended successfully.");
        console.log("Success:", text);
      } else {
        setErrorMessage(text);
        console.error("Failed:", text);
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while appending data. Please try again."
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
              <h1>Append Observation Data</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formPatientId">
                  <Form.Label>Patient ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="patientId"
                    placeholder="Enter patient ID"
                    value={patientId}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formObservationType">
                  <Form.Label>Observation Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    placeholder="Enter observation type"
                    value={observationData.type}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formObservationValue">
                  <Form.Label>Observation Value</Form.Label>
                  <Form.Control
                    type="text"
                    name="value"
                    placeholder="Enter observation value"
                    value={observationData.value}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formObservationUnit">
                  <Form.Label>Observation Unit</Form.Label>
                  <Form.Control
                    type="text"
                    name="unit"
                    placeholder="Enter observation unit"
                    value={observationData.unit}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button
                  variant="success"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Append Observation Data
                </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AppendData;

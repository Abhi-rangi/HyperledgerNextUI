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

const DeletePatient = () => {
  const [patientId, setPatientId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPatientId(value);
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

    const url = "http://localhost:3001/delete-patient";
    const body = {
      org,
      identityName,
      patientId,
    };

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      if (response.ok) {
        setSuccessMessage(
          `Patient record with ID ${patientId} has been deleted.`
        );
        console.log("Success:", text);
      } else {
        setErrorMessage(text);
        console.error("Failed:", text);
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while deleting the patient. Please try again."
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
              <h1>Delete Patient</h1>
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
                <Button
                  variant="danger"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Delete Patient
                </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DeletePatient;

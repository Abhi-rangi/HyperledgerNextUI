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

const CreatePatient = () => {
  const [patientData, setPatientData] = useState({
    resourceType: "Patient",
    id: "",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
          text: "Medical Record Number",
        },
        system: "http://hospital.smarthealthit.org",
        value: "",
        period: { start: "2022-01-01" },
        assigner: { display: "Smart Hospital" },
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "",
        given: [""],
      },
    ],
    gender: "",
    birthDate: "",
    address: [
      {
        use: "home",
        line: [""],
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    ],
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientData((prevData) => {
      // Handle nested properties
      if (name.startsWith("identifier.")) {
        return {
          ...prevData,
          identifier: prevData.identifier.map((ident, index) =>
            index === 0 ? { ...ident, value } : ident
          ),
        };
      }
      if (name.startsWith("name.")) {
        return {
          ...prevData,
          name: prevData.name.map((n, index) =>
            index === 0 ? { ...n, family: value } : n
          ),
        };
      }
      return {
        ...prevData,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const org = Cookies.get("org");
    const enrollmentID = Cookies.get("enrollmentID");

    if (!org || !enrollmentID) {
      setErrorMessage("Organization and enrollment ID are required.");
      return;
    }

    const url = "http://localhost:3001/create-patient";
    const body = {
      org,
      identityName: enrollmentID,
      patientData,
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
        setSuccessMessage(
          "Patient record and initial observation have been created."
        );
        console.log("Success:", text);
      } else {
        setErrorMessage(text);
        console.error("Failed:", text);
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while creating patient. Please try again."
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
              <h1>Create Patient</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formPatientId">
                  <Form.Label>Patient ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="id"
                    placeholder="Enter patient ID"
                    value={patientData.id}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formPatientName">
                  <Form.Label>Family Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name.family"
                    placeholder="Enter family name"
                    value={patientData.name[0].family}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formPatientIdentifier">
                  <Form.Label>Identifier Value</Form.Label>
                  <Form.Control
                    type="text"
                    name="identifier.value"
                    placeholder="Enter identifier value"
                    value={patientData.identifier[0].value}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button
                  variant="success"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Create Patient
                </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreatePatient;

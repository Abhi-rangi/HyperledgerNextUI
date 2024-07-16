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

type Coding = {
  system: string;
  code: string;
  display: string;
};

type IdentifierType = {
  coding: Coding[];
  text: string;
};

type Period = {
  start: string;
};

type Assigner = {
  display: string;
};

type Identifier = {
  use: string;
  type: IdentifierType;
  system: string;
  value: string;
  period: Period;
  assigner: Assigner;
};

type Name = {
  use: string;
  family: string;
  given: string[];
};

type Address = {
  use: string;
  line: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type PatientData = {
  resourceType: string;
  id: string;
  identifier: Identifier[];
  active: boolean;
  name: Name[];
  gender: string;
  birthDate: string;
  address: Address[];
};

const CreatePatient = () => {
  const [patientData, setPatientData] = useState<PatientData>({
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
        period: { start: "" },
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    const updatePatientData = (
      data: PatientData,
      keys: string[],
      value: string
    ): PatientData => {
      if (keys.length === 1) {
        return {
          ...data,
          [keys[0]]: value,
        };
      } else if (keys.length === 2) {
        const key = keys[0] as keyof PatientData;
        const subKey = keys[1];
        if (Array.isArray(data[key])) {
          const index = parseInt(subKey, 10);
          return {
            ...data,
            [key]: data[key].map((item, idx) => (idx === index ? value : item)),
          };
        } else {
          return {
            ...data,
            [key]: {
              ...data[key],
              [subKey]: value,
            },
          };
        }
      } else if (keys.length === 3) {
        const key = keys[0] as keyof PatientData;
        const index = parseInt(keys[1], 10);
        const subKey = keys[2];
        if (Array.isArray(data[key])) {
          return {
            ...data,
            [key]: data[key].map((item, idx) =>
              idx === index ? { ...item, [subKey]: value } : item
            ),
          };
        } else {
          return {
            ...data,
            [key]: {
              ...data[key],
              [index]: {
                ...data[key][index],
                [subKey]: value,
              },
            },
          };
        }
      }
      return data;
    };

    setPatientData((prevData) =>
      updatePatientData(prevData, name.split("."), value)
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
                <Form.Group className="mb-4" controlId="formFamilyName">
                  <Form.Label>Family Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name.0.family"
                    placeholder="Enter family name"
                    value={patientData.name[0].family}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formGivenName">
                  <Form.Label>Given Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name.0.given"
                    placeholder="Enter given name"
                    value={patientData.name[0].given.join(", ")}
                    onChange={(e) =>
                      setPatientData((prevData) => ({
                        ...prevData,
                        name: prevData.name.map((n, idx) =>
                          idx === 0
                            ? {
                                ...n,
                                given: e.target.value
                                  .split(",")
                                  .map((name) => name.trim()),
                              }
                            : n
                        ),
                      }))
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formGender">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={patientData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-4" controlId="formBirthDate">
                  <Form.Label>Birth Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="birthDate"
                    value={patientData.birthDate}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formIdentifierValue">
                  <Form.Label>Identifier Value</Form.Label>
                  <Form.Control
                    type="text"
                    name="identifier.0.value"
                    placeholder="Enter identifier value"
                    value={patientData.identifier[0].value}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formAddressLine">
                  <Form.Label>Address Line</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.0.line"
                    placeholder="Enter address line"
                    value={patientData.address[0].line.join(", ")}
                    onChange={(e) =>
                      setPatientData((prevData) => ({
                        ...prevData,
                        address: prevData.address.map((addr, idx) =>
                          idx === 0
                            ? {
                                ...addr,
                                line: e.target.value
                                  .split(",")
                                  .map((line) => line.trim()),
                              }
                            : addr
                        ),
                      }))
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formCity">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.0.city"
                    placeholder="Enter city"
                    value={patientData.address[0].city}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formState">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.0.state"
                    placeholder="Enter state"
                    value={patientData.address[0].state}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formPostalCode">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.0.postalCode"
                    placeholder="Enter postal code"
                    value={patientData.address[0].postalCode}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formCountry">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.0.country"
                    placeholder="Enter country"
                    value={patientData.address[0].country}
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

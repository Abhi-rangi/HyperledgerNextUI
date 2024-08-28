"use client"; // This directive is necessary for using client-side code

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

const EnrollAdmin = () => {
  const [formData, setFormData] = useState({
    enrollmentID: "admin",
    enrollmentSecret: "adminpw",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("http://localhost:3001/enroll-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.status === 200) {
        setSuccessMessage(responseData.message || "Admin enrollment successful!");
        console.log(formData);
        setTimeout(() => {
          router.push("/adminDashboard"); // Redirect to the desired page
        }, 2000); // 2 seconds delay before redirecting
      } else {
        setErrorMessage(responseData.message || "Admin enrollment failed");
      }
    } catch (error) {
      setErrorMessage('An error occurred while enrolling admin. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <Container fluid className="mt-5">
      <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
        <Card.Body>
          <Row>
            <Col
              md="10"
              lg="6"
              className="order-2 order-lg-1 d-flex flex-column align-items-center"
            >
              <h1 className="text-center fw-bold mb-5 mx-1 mx-md-4 mt-4">
                Enroll Admin
              </h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {successMessage && (
                <Alert variant="success">{successMessage}</Alert>
              )}
              <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4" controlId="formOrg">
                  <Form.Label>Organization</Form.Label>
                  <Form.Control
                    type="text"
                    name="org"
                    placeholder="org1"
                    value="org1"
                    onChange={handleChange}
                    style={{
                      width: "120%",
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      cursor: "not-allowed",
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formEnrollmentID">
                  <Form.Label>Enrollment ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="enrollmentID"
                    placeholder="admin"
                    value={formData.enrollmentID}
                    onChange={handleChange}
                    style={{
                      width: "120%",
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      cursor: "not-allowed",
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formEnrollmentSecret">
                  <Form.Label>Enrollment Secret</Form.Label>
                  <Form.Control
                    type="password"
                    name="enrollmentSecret"
                    placeholder="adminpw"
                    value="adminpw"
                    onChange={handleChange}
                    style={{
                      width: "120%",
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      cursor: "not-allowed",
                    }}
                  />
                </Form.Group>

                <Button variant="dark" size="lg" type="submit" className="mb-4">
                  Enroll Admin
                </Button>
                <Link href="/" passHref>
                  <p
                    className="mt-4"
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "larger",
                    }}
                  >
                    Go to Home
                  </p>
                </Link>
              </Form>
            </Col>

            <Col
              md="10"
              lg="6"
              className="order-1 order-lg-2 d-flex align-items-center"
            >
              <Card.Img
                src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
                className="img-fluid my-2"
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EnrollAdmin;

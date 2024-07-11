"use client"; // This directive is necessary for using client-side code

import React, { useState, ChangeEvent, FormEvent } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";// Adjust the import path as needed
import Link from "next/link";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    org: "org1",
    enrollmentID: "",
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
    setErrorMessage(null); // Reset the error message
    setSuccessMessage(null); // Reset the success message
    try {
      const response = await fetch("http://localhost:3001/checkUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // Log the response status and response text for debugging
      console.log("Response status:", response.status);
      const responseData = await response.text();
      console.log("Response data:", responseData);

      if (response.status === 200) {
        setSuccessMessage(`Login successful! ${responseData} Redirecting...`);
        console.log(formData);
        Cookies.set('org', formData.org, { secure: true, sameSite: 'Strict' });
        Cookies.set('enrollmentID', formData.enrollmentID, { secure: true, sameSite: 'Strict' });
        setTimeout(() => {
          router.push("/dashboard"); // Redirect to the desired page
        }, 2000); // 2 seconds delay before redirecting
      } else {
        setErrorMessage(responseData || "Login failed");
      }
    } catch (error) {
      setErrorMessage("An error occurred while logging in. Please try again.");
      console.error("Error:", error);
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
                Fabric Log In
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
                    placeholder="Enter your enrollment ID"
                    value={formData.enrollmentID}
                    onChange={handleChange}
                    style={{ width: "120%" }}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Log In
                </Button>
                <Link href="/register" passHref>
                  <p
                    className="mt-4"
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "larger",
                    }}
                  >
                    Go to Register
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

export default LoginForm;

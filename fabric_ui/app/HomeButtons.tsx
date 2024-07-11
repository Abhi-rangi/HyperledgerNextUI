"use client"; // This directive is necessary for using client-side code

import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Link from "next/link";

const HomeButtons = () => {
  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-center align-items-center min-vh-100"
    >
      <Row className="text-center mb-5">
        <Col>
          <h1>Welcome to Hyperleder Next JS UI APP</h1>
          <img
            src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
            alt="Welcome"
            className="img-fluid my-2"
            style={{ maxWidth: "800px" }}
          />
        </Col>
      </Row>
      <Row className="text-center">
        <Col md="12">
          <Link href="/register" passHref>
            <Button variant="outline-dark" size="lg" className="me-2">
              Register
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button variant="outline-primary" size="lg" className="ms-2">
              Login
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default HomeButtons;

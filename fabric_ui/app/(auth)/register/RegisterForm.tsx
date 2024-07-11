"use client"; // This directive is necessary for using client-side code

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    org: "org1",
    enrollmentID: "",
    affiliation: "org1.department1",
    role: "client",
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
    console.log(formData);
    try {
      const response = await fetch("http://localhost:3001/registerUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
       console.log("Response status:", response.status);
       const responseData = await response.text();
       console.log("Response data:", responseData);
      if (response.status == 200) {
        setSuccessMessage("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000); // 2 seconds delay before redirecting
      } else {
        setErrorMessage(responseData || "Registration failed");
      }
      // const result = await response.json();
      // console.log(result);
    } catch (error) {
       setErrorMessage('An error occurred while registering. Please try again.');
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
                Fabric Register
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
                    readOnly
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

                <Form.Group className="mb-4" controlId="formAffiliation">
                  <Form.Label>Affiliation</Form.Label>
                  <Form.Control
                    type="text"
                    name="affiliation"
                    placeholder="org1.department1"
                    value="org1.department1"
                    onChange={handleChange}
                    style={{
                      width: "120%",
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      cursor: "not-allowed",
                    }}
                    readOnly
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formRole">
                  <Form.Label>Role</Form.Label>
                  <Form.Control
                    type="text"
                    name="role"
                    placeholder="Client"
                    value="Client"
                    onChange={handleChange}
                    style={{
                      width: "120%",
                      backgroundColor: "#e9ecef",
                      color: "#6c757d",
                      cursor: "not-allowed",
                    }}
                    readOnly
                  />
                </Form.Group>

                <Button variant="dark" size="lg" type="submit" className="mb-4">
                  Register
                </Button>
                <Link href="/login" passHref>
                  <p
                    className="mt-4"
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "larger",
                    }}
                  >
                    Go to Login
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

export default RegisterForm;

// "use client"; // This directive is necessary for using client-side code

// import React from "react";
// import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";

// const RegisterForm = () => {
//   return (
//     <Container fluid className="mt-5">
//       <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
//         <Card.Body>
//           <Row>
//             <Col
//               md="10"
//               lg="6"
//               className="order-2 order-lg-1 d-flex flex-column align-items-center"
//             >
//               <h1 className="text-center fw-bold mb-5 mx-1 mx-md-4 mt-4">
//                 Sign up
//               </h1>

//               <Form>
//                 <Form.Group className="mb-4" controlId="formName">
//                   <Form.Label>Your Name</Form.Label>
//                   <Form.Control type="text" placeholder="Enter your name" />
//                 </Form.Group>

//                 <Form.Group className="mb-4" controlId="formEmail">
//                   <Form.Label>Your Email</Form.Label>
//                   <Form.Control type="email" placeholder="Enter your email" />
//                 </Form.Group>

//                 <Form.Group className="mb-4" controlId="formPassword">
//                   <Form.Label>Password</Form.Label>
//                   <Form.Control type="password" placeholder="Enter password" />
//                 </Form.Group>

//                 <Form.Group className="mb-4" controlId="formRepeatPassword">
//                   <Form.Label>Repeat your password</Form.Label>
//                   <Form.Control
//                     type="password"
//                     placeholder="Repeat your password"
//                   />
//                 </Form.Group>

//                 <Button variant="dark" size="lg" className="mb-4">
//                   Register
//                 </Button>
//               </Form>
//             </Col>

//             <Col
//               md="10"
//               lg="6"
//               className="order-1 order-lg-2 d-flex align-items-center"
//             >
//               <Card.Img
//                 src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-registration/draw1.webp"
//                 className="img-fluid my-2"
//               />
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// };

// export default RegisterForm;

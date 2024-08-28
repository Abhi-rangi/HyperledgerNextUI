"use client"; // This directive is necessary for using client-side code

import React, { useState, ChangeEvent, FormEvent } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

const DeployChaincode = () => {
  const [chaincodeName, setChaincodeName] = useState<string>("");
  const [chaincodeVersion, setChaincodeVersion] = useState<string>("");
  const [channelName, setChannelName] = useState<string>("");
  const [chaincodePath, setChaincodePath] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "chaincodeName") {
      setChaincodeName(value);
    } else if (name === "chaincodeVersion") {
      setChaincodeVersion(value);
    } else if (name === "channelName") {
      setChannelName(value);
    } else if (name === "chaincodePath") {
      setChaincodePath(value);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const url = "http://localhost:3001/deploy-chaincode";
    const body = { chaincodeName, chaincodeVersion, channelName, chaincodePath };

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
        setSuccessMessage(`Chaincode ${chaincodeName} deployed successfully.`);
        console.log("Success:", text);
      } else {
        setErrorMessage(text);
        console.error("Failed:", text);
      }
    } catch (error) {
      setErrorMessage("An error occurred while deploying the chaincode. Please try again.");
      console.error("Error:", error);
    }
  };

  return (
    <Container fluid className="mt-5">
      <Card className="text-black m-5" style={{ borderRadius: "25px" }}>
        <Card.Body>
          <Row>
            <Col>
              <h1>Deploy Chaincode</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formChaincodeName">
                  <Form.Label>Chaincode Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="chaincodeName"
                    placeholder="Enter chaincode name"
                    value={chaincodeName}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formChaincodeVersion">
                  <Form.Label>Chaincode Version</Form.Label>
                  <Form.Control
                    type="text"
                    name="chaincodeVersion"
                    placeholder="Enter chaincode version"
                    value={chaincodeVersion}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formChannelName">
                  <Form.Label>Channel Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="channelName"
                    placeholder="Enter channel name"
                    value={channelName}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-4" controlId="formChaincodePath">
                  <Form.Label>Chaincode Path</Form.Label>
                  <Form.Control
                    type="text"
                    name="chaincodePath"
                    placeholder="Enter chaincode path"
                    value={chaincodePath}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button variant="success" size="lg" type="submit" className="mb-4">
                  Deploy Chaincode
                </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DeployChaincode;

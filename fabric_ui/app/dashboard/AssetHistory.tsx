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
  Table,
} from "react-bootstrap";
import Cookies from "js-cookie";

const AssetHistory = () => {
  const [assetId, setAssetId] = useState<string>("");
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setAssetId(value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setAssetHistory([]);

    const org = Cookies.get("org");
    const identityName = Cookies.get("enrollmentID");

    if (!org || !identityName) {
      setErrorMessage("Organization and identity name are required.");
      return;
    }

    const url = `http://localhost:3001/asset-history/${assetId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          org: org,
          identityname: identityName,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssetHistory(data.history);
      } else {
        const errorData = await response.text();
        setErrorMessage(errorData);
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while retrieving the asset history. Please try again."
      );
      console.error("Error:", error);
    }
  };

  const truncateTxId = (txId: string) => {
    if (txId.length > 10) {
      return `${txId.substring(0, 10)}....`;
    }
    return txId;
  };

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <Container fluid className="mt-5">
      <Card
        className="text-black m-5 shadow-lg"
        style={{ borderRadius: "25px" }}
      >
        <Card.Body>
          <Row>
            <Col>
              <h1>Asset History</h1>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formAssetId">
                  <Form.Label>Asset ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="assetId"
                    placeholder="Enter asset ID"
                    value={assetId}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="mb-4"
                >
                  Get Asset History
                </Button>
              </Form>
              {assetHistory.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <Table
                    striped
                    bordered
                    hover
                    className="mt-4"
                    style={{ width: "100%" }}
                  >
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Timestamp</th>
                        <th>Is Delete</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetHistory.map((history, index) => (
                        <React.Fragment key={index}>
                          <tr onClick={() => toggleRow(index)}>
                            <td>{truncateTxId(history.txId)}</td>
                            <td>
                              {new Date(
                                history.timestamp.seconds * 1000
                              ).toLocaleString()}
                            </td>
                            <td>{history.isDelete}</td>
                            <td>
                              {expandedRows.has(index)
                                ? "Click to collapse"
                                : "Click to expand"}
                            </td>
                          </tr>
                          {expandedRows.has(index) && (
                            <tr>
                              <td
                                colSpan={4}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {JSON.stringify(history.data, null, 2)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AssetHistory;

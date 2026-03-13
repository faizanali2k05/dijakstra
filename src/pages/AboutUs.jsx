import React from 'react'
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap'

export default function AboutUs() {
  return (
    <Container className="page page-aboutus">
      <Row className="mb-3">
        <Col>
          <h2>About the Author</h2>
          <p>Faizan Ali — developer, learner, and visualizer creator.</p>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Contact</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>Email: <a href="mailto:aizanali15111511@gmail.com">aizanali15111511@gmail.com</a></ListGroup.Item>
                <ListGroup.Item>Phone: <a href="tel:+923085560981">(+92) 3085560981</a></ListGroup.Item>
                <ListGroup.Item>Website: <a href="https://faizanali2k05.netlify.app/" target="_blank">faizanali2k05.netlify.app</a></ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Social</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>LinkedIn: <a href="https://www.linkedin.com/in/faizanali2k05/" target="_blank">faizanali2k05</a></ListGroup.Item>
                <ListGroup.Item>GitHub: <a href="https://github.com/faizanali2k05" target="_blank">faizanali2k05</a></ListGroup.Item>
                <ListGroup.Item>X: <a href="https://x.com/faizanali2k05" target="_blank">@faizanali2k05</a></ListGroup.Item>
                <ListGroup.Item>Instagram: <a href="https://instagram.com/faizanali2k05" target="_blank">@faizanali2k05</a></ListGroup.Item>
                <ListGroup.Item>WhatsApp: <a href="https://wa.me/923085560981" target="_blank">+923085560981</a></ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

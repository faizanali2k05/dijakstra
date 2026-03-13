import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import logo from '../assets/logo.png'

export default function Footer(){
  return (
    <footer style={{marginTop:20,padding:'18px 0',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
      <Container>
        <Row className="align-items-center">
          <Col md={6} style={{display:'flex',alignItems:'center',gap:12}}>
            <img src={logo} alt="logo" style={{width:36,height:36}} />
            <div>
              <strong>Faizan Ali</strong>
              <div style={{fontSize:12,color:'var(--muted)'}}>Dijkstra Visualizer</div>
            </div>
          </Col>
          <Col md={6} style={{textAlign:'right'}}>
            <div style={{fontSize:14}}>Follow: <a href="https://github.com/faizanali2k05" target="_blank">GitHub</a> • <a href="https://www.linkedin.com/in/faizanali2k05/" target="_blank">LinkedIn</a></div>
            <div style={{fontSize:12,color:'var(--muted)'}}>© {new Date().getFullYear()} Faizan Ali</div>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

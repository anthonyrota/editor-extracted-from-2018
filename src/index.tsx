import { Example } from 'components/editor'
import React from 'react'
import ReactDOM from 'react-dom'
import * as serviceWorker from 'serviceWorker'
import './index.css'

ReactDOM.render(
  <Container>
    <Center>
      <Example />
    </Center>
  </Container>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()

function Container(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
): JSX.Element {
  return (
    <div
      style={{
        position: 'relative',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: '#fff'
      }}
      {...props}
    />
  )
}

function Center(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
): JSX.Element {
  return <div style={{ maxWidth: '740px', margin: 'auto' }} {...props} />
}

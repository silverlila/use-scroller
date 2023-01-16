![npm](https://img.shields.io/npm/v/scroll-js)
![node](https://img.shields.io/node/v/scroll-js)
![license](https://img.shields.io/npm/l/scroll-js)

## use-scroll

A light-weight library that will allow you to scroll any html element using simple react hooks provided by the package.
In addition to providing extra scrolling features, this library also return a number of callback that can triger scroll operation depending on the user needs.

## Installation

### React

```bash
#Yarn
yarn add @use-scroll

#NPM
npm install @use-scroll

```

## Usage

### Carousel

```bash
import { useScroll } from 'use-scroll'

export default function Carousel() {
  const { ref, scrollLeft, scrollRight } = useScroll<HTMLDivElement>()
  return (
    <>
      <button onClick={() => scrollLeft()} >
        Prev
      </button>
      <button onClick={() => scrollRight()}>
        Next
      </button>

      <Carousel ref={ref} />
    </>
  )
}
```

## use-scroll

A light-weight library that will allow you to scroll any html element using simple react hooks provided by the package.
In addition to providing extra scrolling features, this library also return a number of callback that can triger scroll operation depending on the user needs. The APIs allows you to scroll using animations that are based loosely on the [`scrollOptions` of the DOM specification](https://drafts.csswg.org/cssom-view/#dictdef-scrolloptions).

## Installation

### React

```bash
#Yarn
yarn add @use-gesture/react

#NPM
npm install @use-gesture/react

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

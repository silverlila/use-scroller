# use-scroller

A lightweight library that enables smooth scrolling for HTML elements using simple React hooks provided by the package. This library offers additional scrolling features and provides several callback functions for customizable scroll operations.

<div align="center">
  <img src="https://s9.gifyu.com/images/ezgif.com-gif-maker3092e8916a41884d.gif" width="400"/>
  <img src="https://s3.gifyu.com/images/ezgif.com-gif-maker-1c4ee7c66dcd4dd01.gif" width="400"/>
</div>

## Installation

```bash
#YARN
yarn add use-scroller

#NPM
npm install use-scroller

#PNPM
pnpm install use-scroller

```

## Usage

### Scroll state

```typescript
import { useScroll } from 'use-scroller'

export default function ScrollStateExample() {
  const { ref, state } = useScroll<HTMLDivElement>()

  return (
    <>
      <p>Scroll State:</p>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <div ref={ref} style={{ height: '200px', overflowY: 'scroll' }}>
        {/* Your content */}
      </div>
    </>
  )
}
```

### Carousel

```typescript
import { useScroll } from 'use-scroller'

export default function CarouselExample() {
  const { ref, scrollLeft, scrollRight } = useScroll<HTMLDivElement>()

  return (
    <>
      <button onClick={() => scrollLeft()}>Scroll Left</button>
      <button onClick={() => scrollRight()}>Scroll Right</button>

      <div ref={ref} style={{ width: '400px', overflowX: 'scroll' }}>
        {/* Your carousel content */}
      </div>
    </>
  )
}
```

### Box

```typescript
import { useScroll } from 'use-scroller'

export default function BoxExample() {
  const { ref, scrollLeft, scrollRight, scrollTop, scrollBottom, scrollToCenter } =
    useScroll<HTMLDivElement>()

  return (
    <>
      <button onClick={() => scrollToCenter()}>Scroll to Center</button>
      <button onClick={() => scrollLeft()}>Scroll Left</button>
      <button onClick={() => scrollRight()}>Scroll Right</button>
      <button onClick={() => scrollTop()}>Scroll to Top</button>
      <button onClick={() => scrollBottom()}>Scroll to Bottom</button>
      <div ref={ref} style={{ width: '300px', height: '300px', overflow: 'scroll' }}>
        {/* Your content */}
      </div>
    </>
  )
}
```

### Scroll to target

```typescript
import { useWindowScroll } from 'use-scroller'

export default function ScrollToTargetExample() {
  const { scrollToTarget } = useWindowScroll()
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)

  return (
    <>
      <button onClick={() => scrollToTarget(ref1)}>Scroll to Target 1</button>
      <button onClick={() => scrollToTarget(ref2)}>Scroll to Target 2</button>
      <button onClick={() => scrollToTarget(ref3)}>Scroll to Target 3</button>

      <div>
        <div ref={ref1} style={{ height: '400px', backgroundColor: 'lightcoral' }}>
          Target 1
        </div>
        <div ref={ref2} style={{ height: '400px', backgroundColor: 'lightseagreen' }}>
          Target 2
        </div>
        <div ref={ref3} style={{ height: '400px', backgroundColor: 'lightsalmon' }}>
          Target 3
        </div>
      </div>
    </>
  )
}
```

## API Documentation

### Available Hooks

#### `useScroll`

This hook is designed to handle element scroll events, enabling smooth scrolling for specified HTML elements.

##### Options

- `direction` (Type: `horizontal` or `vertical`, Default: `vertical`): Specifies the desired scroll direction. You can set it to `horizontal` or `vertical` based on your needs.

- `duration` (Type: `number`, Default: `300`): Sets the animation duration for scrolling. Adjust this value to control the speed of the scroll animation.

- `easingOption` (Type: `EasingOptions`, Default: `ease-in-out`): Determines the type of animation to use for scrolling. You can choose from various easing options such as `ease-in`, `ease-out`, `ease-in-out`, etc., to customize the scroll animation's behavior.

#### `useWindowScroll`

This hook is tailored to handle window scroll events, making it easy to manage scrolling operations within the entire window.

##### Options

- `duration` (Type: `number`, Default: `300`): Specifies the animation duration for scrolling operations. Adjust this value to control the speed of the scroll animation.

- `easingOption` (Type: `EasingOptions`, Default: `ease-in-out`): Defines the type of animation to use for scrolling within the window. You can choose from various easing options to customize the scroll animation's behavior.

Feel free to update and expand this documentation further based on your library's features and usage patterns.

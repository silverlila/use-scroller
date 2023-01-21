## use-scroller

![npm](https://img.shields.io/npm/v/scroll-js)
![node](https://img.shields.io/node/v/scroll-js)
![license](https://img.shields.io/npm/l/scroll-js)

A light-weight library that will allow you to scroll any html element using simple react hooks provided by the package.
In addition to providing extra scrolling features, this library also return a number of callback that can triger scroll operation depending on the user needs.

<p align="middle">
  <img src="https://s9.gifyu.com/images/ezgif.com-gif-maker3092e8916a41884d.gif" width="400"/>
  <img src="https://s3.gifyu.com/images/ezgif.com-gif-maker-1c4ee7c66dcd4dd01.gif" width="400"/>
</p>

## Installation

### React

```javascript
#YARN
yarn add use-scroller

#NPM
npm install use-scroller

#PNPM
pnpm install use-scroller

```

## Usage

### Scroll state

```javascript
import { useScroll } from 'use-scroller'

export default function Carousel() {
  const { ref, state } = useScroll<HTMLDivElement>()
  return (
    <>
      {JSON.stringify(state)}
      <Box ref={ref} />
    </>
  )
}
```

### Carousel

```javascript
import { useScroll } from 'use-scroller'

export default function Carousel() {
  const { ref, scrollLeft, scrollRight } = useScroll<HTMLDivElement>()
  return (
    <>
      <button onClick={() => scrollLeft()} >
        Top
      </button>
      <button onClick={() => scrollRight()}>
        Next
      </button>

      <Box ref={ref} />
    </>
  )
}
```

### Box

```javascript
import { useScroll } from 'use-scroller'

export default function ScrollBox() {
  const { ref, scrollLeft, scrollRight, scrollTop, scrollBotom, scrollCenter } = useScroll<HTMLDivElement>()
  return (
    <>
      <button onClick={() => scrollCenter()} >
        Center
      </button>
      <button onClick={() => scrollLeft()} >
        Left
      </button>
      <button onClick={() => scrollRight()}>
        Right
      </button>
      <button onClick={() => scrollTop()}>
        Top
      </button>
      <button onClick={() => scrollBotom()}>
        Bottom
      </button>
      # Box component
      <Box ref={ref} />
    </>
  )
}
```

### Scroll to target

```javascript
import { useScroll } from 'use-window-scroll'

export default function App() {
  const { scrollToTarget } = useWindowScroll()
  const ref1 = useRef(null)
  const ref2 = useRef(null)
  const ref3 = useRef(null)

  return (
    <>
      <Navigation>
        <Item onClick={() => scrollToTarget(ref1)}>Target 1</Item>
        <Item onClick={() => scrollToTarget(ref2)}>Target 2</Item>
        <Item onClick={() => scrollToTarget(ref3)}>Target 3</Item>
      </Navigation>

      <FirstTarget ref={ref1} />
      <SecondTarget ref={ref2} />
      <ThirdTarget ref={ref3} />
    </>
  )
}
```

## API Documentation

#### Available hooks

| Hook              | Description                   |
| ----------------- | ----------------------------- |
| `useScroll`       | Handles element scroll events |
| `useWindowScroll` | Handles window scroll events  |

#### useScroll

| Option         | Type                     | Default     | Description                          |
| -------------- | ------------------------ | ----------- | ------------------------------------ |
| `direction`    | `horizontal or vertical` | vertical    | Set the desired scroll direction     |
| `duration`     | `number`                 | 300         | Set the animation duration to scroll |
| `easingOption` | `EasingOptions`          | ease-in-out | Set the type of animation to scroll  |

#### useWindowScroll hook

| Option         | Type            | Default     | Description                          |
| -------------- | --------------- | ----------- | ------------------------------------ |
| `duration`     | `number`        | 300         | Set the animation duration to scroll |
| `easingOption` | `EasingOptions` | ease-in-out | Set the type of animation to scroll  |

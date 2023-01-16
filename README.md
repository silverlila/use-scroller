![npm](https://img.shields.io/npm/v/scroll-js)
![node](https://img.shields.io/node/v/scroll-js)
![license](https://img.shields.io/npm/l/scroll-js)

## use-scroll

A light-weight library that will allow you to scroll any html element using simple react hooks provided by the package.
In addition to providing extra scrolling features, this library also return a number of callback that can triger scroll operation depending on the user needs.

<p align="middle">
  <img src="https://s9.gifyu.com/images/ezgif.com-gif-maker3092e8916a41884d.gif" width="400"/>
  <img src="https://s3.gifyu.com/images/ezgif.com-gif-maker-1c4ee7c66dcd4dd01.gif" width="400"/>
</p>

## Installation

### React

```bash
#YARN
yarn add use-scroll

#NPM
npm install use-scroll

#PNPM
pnpm install use-scroll

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

```bash
import { useScroll } from 'use-scroll'

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

## API Documentation

#### Available hooks

| Hook              | Description                   |
| ----------------- | ----------------------------- |
| `useScroll`       | Handles element scroll events |
| `useWindowScroll` | Handles window scroll events  |

#### useScroll(options)

| Option         | Type                     | Description                          |
| -------------- | ------------------------ | ------------------------------------ |
| `direction`    | `horizontal or vertical` | Set the desired scroll direction     |
| `duration`     | `number`                 | Set the animation duration to scroll |
| `easingOption` | `EasingOptions`          | Set the type of animation to scroll  |

#### useWindowScroll(options)

| Option         | Type            | Description                          |
| -------------- | --------------- | ------------------------------------ |
| `duration`     | `number`        | Set the animation duration to scroll |
| `easingOption` | `EasingOptions` | Set the type of animation to scroll  |

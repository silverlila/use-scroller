import React from 'react'

declare const __DEV__: boolean

/** @private is the given object a Function? */
export const isFunction = (obj: any) => typeof obj === 'function'

export const getElement = (ref: React.RefObject<HTMLElement>) => {
  if (!ref.current) {
    if (__DEV__) {
      console.error(`Could not resolve ref object. getElement function accepts a rect ref object.`)
    }
    throw new Error(`Could not resolve ref object: ${ref}`)
  }
  return ref.current
}
